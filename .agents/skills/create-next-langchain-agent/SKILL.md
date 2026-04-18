---
name: create-next-langchain-agent
description: 指导在 Next.js App Router 项目中快速搭建一个基于 LangChain 的流式 Agent 应用
---

# 创建 Next.js + LangChain 流式 Agent 应用

本技能用于快速复刻「Next.js App Router + LangChain Agent + LangGraph 流式 + Postgres 检查点 + AI Elements 前端」这套技术栈，按 4 步渐进落地。**本技能只给 API 名称、配置点和极小示例**，具体实现细节请直接查阅对应库的官方文档。


关键约定：

- 前后端通过 **单个 SSE 路由 `/api/agent`** 通信；前端用 `@langchain/react` 的 `useStream` + `FetchStreamTransport` 消费。
- 请求体必须带 `config.configurable.thread_id`（即 LangGraph 的会话 ID）；`thread_id` 约定从 URL 查询串 `?userId=<id>` 派生，demo 里一一对应。
- 后端 `agent.stream(..., { streamMode: ["messages", "values", "updates"] })`：`messages` 流 token/工具增量，`values` 回灌人类消息和检查点状态，`updates` 用于暴露 **HITL 中断（`interrupt`）** 到前端。
- 工具既可以是进程内 `tool(...)`，也可以通过 `MultiServerMCPClient` 把 MCP server 转为 LangChain 工具；还支持用 `interrupt()` 实现 **HITL（pause/resume）** 工具。
- 历史记录由 `PostgresSaver` 按 `thread_id` 持久化，页面初始化通过 `agent.getState(...)` + `toMessageDict` 预填。

## 必备依赖

连接到 LangChain HTTP MCP 来获取详细 API 文档 https://docs.langchain.com/mcp

```bash
npm i next react react-dom \
  langchain @langchain/core @langchain/langgraph @langchain/openai \
  @langchain/langgraph-checkpoint-postgres \
  @langchain/langgraph-sdk @langchain/react \
  @langchain/mcp-adapters @modelcontextprotocol/sdk zod
# UI
npx ai-elements@latest add conversation message prompt-input tool
```

- `@langchain/langgraph` 提供 `interrupt` / `Command`（HITL 必需）。
- `@modelcontextprotocol/sdk` 仅在自建 stdio MCP server 时需要；只是把已有的远端/第三方 MCP 接进来可省略。

环境变量（`.env.local`）：
```env
# Agent 接入的大模型（示例为 openrouter，可换成其它）
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_API_KEY=
AGENT_MODEL_ID=

# PostGreSQL 链接（从 supabase 的 connect -> direct -> Transaction pooler 中导出）
DATABASE_URL=postgresql://postgres.xxxxxxxx.pooler.supabase.com:6543/postgres

# LangSmith 自动监控（在这里配置即可，无需任何代码即自动启用）
LANGSMITH_TRACING=true
LANGSMITH_ENDPOINT=https://api.smith.langchain.com
LANGSMITH_API_KEY=
LANGSMITH_PROJECT=
```

## 开发步骤

### Step 1 — 最小 Agent：SSE 路由 + 前端渲染

**目标**：跑通「浏览器发一条消息 → 后端流式返回 → 前端逐块显示」，不做持久化、不做美化。

**后端核心 API（用 nextjs 的 app router 实现）**：

- 用 `langchain` 的 `createAgent({ model, tools })` + `tool(fn, { name, description, schema })`（schema 用 `zod`）。
- 模型用 `@langchain/openai` 的 `ChatOpenAI`，通过 `configuration.baseURL` 指到 OpenRouter。
- 用 `agent.stream(input, { encoding: "text/event-stream", streamMode: ["messages", "values", "updates"], signal: req.signal })` 拿到 `ReadableStream`，直接 `new Response(stream, { headers: { "Content-Type": "text/event-stream" }})` 返回前端。`updates` 在无 HITL 时无副作用，留着能直接兼容后续 Step 4。

极简骨架：

```ts
const agent = createAgent({ model, tools: [myTool] });
const stream = await agent.stream(
  { messages: [{ role: "user", content: text }] },
  { encoding: "text/event-stream", streamMode: ["messages", "values", "updates"] },
);
return new Response(stream, { headers: { "Content-Type": "text/event-stream" } });
```

**前端核心逻辑**：

- 用 `@langchain/react` 的 `useStream({ transport: new FetchStreamTransport({ apiUrl: "/api/agent" }), throttle: 50 })`，它会自动处理 LangGraph SSE 协议，暴露 `{ messages, submit, isLoading, error }`。
- 渲染用 AI Elements：（必读！）AI Elements 接入 LangChain 前端: https://docs.langchain.com/oss/python/langchain/frontend/integrations/ai-elements
- 工具卡片用 `@langchain/langgraph-sdk/utils` 的 `getToolCallsWithResults(messages)` 把 `AIMessage.tool_calls` 与后续 `ToolMessage` 配对。
- 消息类型判别：`HumanMessage.isInstance / AIMessage.isInstance`（来自 `@langchain/core/messages`），并兼容 `type === "human" | "ai"` 的 dict 形态（因为 `useStream` 的 `messages` 常是 `toMessageDict` 后的纯对象）。
- 提交一条消息：`submit({ messages: [new HumanMessage(text)] }, { optimisticValues: { messages: [...prev, human] } })`。

前端核心连接 hook 示例代码:
```ts
"use client";

import { FetchStreamTransport, useStream } from "@langchain/react";
import { useMemo } from "react";

export function useAgentChat() {
  const transport = useMemo(
    () =>
      new FetchStreamTransport({
        apiUrl: "/api/agent",
      }),
    [],
  );

  return useStream({
    transport,
    throttle: 50,
  });
}
```

**验收**：输入框带 loading 状态、助手气泡逐字增长、工具调用显示为可折叠卡片。

参考：
- AI Elements 完整文档：https://elements.ai-sdk.dev/
- `useStream` (React)：https://docs.langchain.com/langgraph-platform/use-stream-react
- `FetchStreamTransport`：https://docs.langchain.com/langgraph-platform/use-stream-react#custom-transport


### Step 2 — 接入 `thread_id` + PostgresSaver 检查点

**目标**：在用户粒度实现多轮记忆跨请求持久化。

**后端核心 API**：

- 单例化检查点：`PostgresSaver.fromConnString(process.env.DATABASE_URL)`；首次调用前 `await checkpointer.setup()`（用一个共享 Promise 做 lazy setup，避免每次建表）。
- `createAgent({ model, tools, checkpointer })` 传入检查点。
- `agent.stream(input, { configurable: { thread_id }, streamMode: ["messages", "values", "updates"], ... })` —— 这是 LangGraph 读写 checkpoint 的唯一入口。
- 请求体校验：`body.config.configurable.thread_id` 必须存在，否则 400；入参消息用 `coerceMessageLikeToMessage`（来自 `@langchain/core/messages`）规范化。

**前端核心 API**：

- `useStream({ transport, threadId: userId, throttle: 50 })` —— `threadId` 会自动写入 `config.configurable.thread_id`。
- 把 `userId` 传为 thread_id 即可实现不同用户不同对话

**关键注意点**：

- 每次 `submit` **只需发送新的一条 human 消息**；历史由 `PostgresSaver` 侧自动合并。

参考：
- LangGraph persistence / PostgresSaver：https://docs.langchain.com/oss/javascript/langchain/short-term-memory#in-production

### Step 3 — 页面初始渲染历史对话，细化 UI/UX

**目标**：刷新页面或跨会话重新打开时，立即看到完整历史，不用等第一次 `submit` 触发 `values` 流。

**后端侧（RSC 中可调用）**：

- 在 `src/lib/agent.ts` 里复用同一个 agent 单例，暴露：
  - `getThreadMessages(thread_id)`：
    1. `ensureCheckpointerReady()`（lazy `setup()`）
    2. `const snapshot = await agent.getState({ configurable: { thread_id } })`
    3. `snapshot.values.messages?.map((m) => toMessageDict(m))`（`toMessageDict` 来自 `@langchain/langgraph-sdk/ui`，得到 flat dict，跟 `useStream` 实际用到的格式一致）
- 失败时返回 `[]`，让 UI 降级为空会话。

**前端侧**：

- `app/page.tsx`（Server Component）从 `searchParams.userId` 读取 demo 身份（默认 `"1"`），直接用作 `thread_id` → `await getThreadMessages(userId)` → 传给 `<AgentChat userId={userId} initialMessages={...} />`。
- `useAgentChat(userId, initialMessages)` 用 `useStream({ ..., threadId: userId, initialValues: { messages: initialMessages } })` 进行 SSR 种子注入。
- 在 UI 里做一层降级：当 `stream.messages.length === 0` 时渲染 `initialMessages`（因为 `useStream` 只有开始流式后才会物化 `values`）。

极简示意：

```tsx
// app/page.tsx
const initialMessages = await getThreadMessages(userId);
return <AgentChat userId={userId} initialMessages={initialMessages} />;
```

```ts
// hooks/use-agent-chat.ts
return useStream({
  transport: new FetchStreamTransport({ apiUrl: "/api/agent" }),
  threadId: userId,
  initialValues: { messages: initialMessages },
  throttle: 50,
});
```

**验收**：发送消息正常显示，刷新后自动展示历史，并且旧消息能在上下文中被 agent 记住


### Step 4 — HITL（human-in-the-loop）工具：`interrupt` / `Command.resume`

**目标**：Agent 在工具内部暂停，由前端弹卡收集用户输入后再 resume，结果作为 tool output 回到对话。

**工具端（`src/lib/agent.ts`）**：

- 从 `@langchain/langgraph` 导入 `interrupt`。
- 在 `tool(...)` 的实现函数里调用 `interrupt({ type: "xxx", ... })` 抛出一个结构化 payload；该调用会让 graph 暂停，`interrupt()` 的返回值就是前端 resume 时传进来的值。

```ts
import { interrupt } from "@langchain/langgraph";

const testHitlTool = tool(
  async ({ prompt }) => {
    const resumed = interrupt({ type: "test_hitl", prompt });
    return typeof resumed === "string" ? resumed : JSON.stringify(resumed);
  },
  {
    name: "test_hitl",
    description: "Pause and wait for user input; returns the resumed value.",
    schema: z.object({ prompt: z.string().default("Please type text.") }),
  },
);
```

**路由端（`src/app/api/agent/route.ts`）**：

- 从 `@langchain/langgraph` 导入 `Command`。
- 除了普通的 `{ messages }` 入参之外，额外识别 `body.command.resume`，命中时改用 `new Command({ resume: body.command.resume })` 作为 `agent.stream` 的输入。
- `streamMode` 必须包含 `"updates"`，interrupt 才会被 SSE 框架推给前端。

```ts
const streamInput = body.command?.resume !== undefined
  ? new Command({ resume: body.command.resume })
  : { messages: rawMessages.map(coerceMessageLikeToMessage) };

const stream = await agent.stream(streamInput, {
  encoding: "text/event-stream",
  streamMode: ["messages", "values", "updates"],
  configurable: { thread_id },
  signal: req.signal,
});
```

**前端侧（`AgentChat.tsx`）**：

- `useStream` 返回值里取 `interrupt`；当 `interrupt?.value?.type === "<你自定义的 type>"` 时渲染确认卡。
- 用户确认时调用 `submit(null, { command: { resume: <用户输入> } })` 恢复 graph（`submit` 的第一参数传 `null` 表示本次不发新消息）。
- 加载态期间禁用文本输入框，引导用户先完成 HITL 卡。

**验收**：输入 `Call test_hitl with prompt "..."` 后前端出现确认卡；点击确认后 tool card 更新为已完成、tool output 等于你的输入。

参考：
- LangGraph Human-in-the-loop（JS）：https://docs.langchain.com/oss/javascript/langgraph/human-in-the-loop


## 其它

### MCP 工具

把 MCP server 暴露的工具接入 agent：

```ts
import { MultiServerMCPClient } from "@langchain/mcp-adapters";

const mcpClient = new MultiServerMCPClient({
  myServer: {
    transport: "stdio",
    command: "node",
    args: [path.resolve(process.cwd(), "mcp/my-server.mjs")],
  },
  // 远端服务可用 transport: "sse" / "http" + url
});

const mcpTools = await mcpClient.getTools();
createAgent({ model, tools: [...localTools, ...mcpTools], checkpointer });
```

自建一个最简 stdio MCP server（`mcp/my-server.mjs`）：

```js
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const server = new Server(
  { name: "my-server", version: "0.1.0" },
  { capabilities: { tools: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [{
    name: "my_tool",
    description: "...",
    inputSchema: { type: "object", properties: { q: { type: "string" } }, required: ["q"] },
  }],
}));

server.setRequestHandler(CallToolRequestSchema, async ({ params }) => {
  return { content: [{ type: "text", text: `got: ${params.arguments?.q}` }] };
});

await server.connect(new StdioServerTransport());
```

参考：https://docs.langchain.com/oss/javascript/langchain/mcp
