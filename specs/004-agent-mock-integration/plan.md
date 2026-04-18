# Implementation Plan: Agent 对话模块（Mock 实现）

**Branch**: `004-agent-mock-integration` | **Date**: 2026-04-18 | **Spec**: `/specs/004-agent-mock-integration/spec.md`
**Input**: Feature specification from `/specs/004-agent-mock-integration/spec.md`

## Summary

在移动端 `/mobile/assistant` 交付可用的 Agent 对话主链路：真实大模型（OpenRouter）流式回复 + mock queryTicket + mock 知识问答 + 前端拦截 `create_ticket` 的 HITL 卡片。  
严格遵循 `.agents/skills/create-next-langchain-agent/SKILL.md` 的技术路线：

- 所有服务端入口走 **Next.js App Router API 路由**（不使用 LangGraph Platform / LangGraph Server 独立部署）。
- 真实数据库：使用现有 Supabase Postgres，通过 `PostgresSaver.fromConnString(DATABASE_URL)` 持久化 LangGraph checkpoint。
- 单一 SSE 路由 `/api/agent`；前端通过 `@langchain/react` 的 `useStream` + `FetchStreamTransport` 消费。
- `thread_id` 直接使用当前登录用户唯一 ID；每个线程最多保留最近 6 轮消息。
- HITL：按 spec 已确认的澄清结果，采用前端拦截普通 `tool_call` 渲染卡片的方案（不引入 `interrupt` / `Command.resume`）。

## Technical Context

**Language/Version**: TypeScript 5.x, Next.js 16.2.3 (App Router), React 19.2
**Primary Dependencies**:

- `langchain`、`@langchain/core`、`@langchain/openai`
- `@langchain/langgraph`（仅作为库使用，不部署 LangGraph Platform / Server）
- `@langchain/langgraph-checkpoint-postgres`、`@langchain/langgraph-sdk`
- `@langchain/react`（`useStream` + `FetchStreamTransport`）
- `zod`
- AI Elements（`npx ai-elements@latest add conversation message prompt-input tool`）
- 现有：`@supabase/ssr`、`@supabase/supabase-js`

**Storage**: Supabase Postgres（复用现有实例；`PostgresSaver` 连接同一个库）
**Testing**: `npm run lint` + `npx tsc --noEmit` + 按 `quickstart.md` 手动验收
**Target Platform**: Next.js Web 应用（移动端页面 + 后端 Route Handler）
**Project Type**: 单仓 Web 应用（前后端同仓）
**Performance Goals**: 首 token ≤ 3s；创建工单确认后反馈 ≤ 3s；刷新可恢复最近 6 轮
**Constraints**: MVP 优先；中文界面；不使用 LangGraph 独立服务；HITL 不使用 interrupt/resume
**Scale/Scope**: 1 个移动端页面、1 条流式 Agent API、3 条意图分支（查询/建单/知识）+ 1 条超范围分支

## Environment Variables

严格按 skill 约定配置 `.env.local`：

```env
# Agent 模型（OpenRouter）
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_API_KEY=
AGENT_MODEL_ID=moonshotai/kimi-k2.5

# 真实数据库连接（Supabase → Connect → Transaction Pooler Direct URL）
DATABASE_URL=postgresql://postgres.<project-ref>.pooler.supabase.com:6543/postgres

# LangSmith 自动监控（可选但建议开启，无需任何代码接入）
LANGSMITH_TRACING=true
LANGSMITH_ENDPOINT=https://api.smith.langchain.com
LANGSMITH_API_KEY=
LANGSMITH_PROJECT=
```

要求：

- `DATABASE_URL` 必须指向真实 Supabase Postgres 的 Transaction Pooler 地址。
- `OPENROUTER_API_KEY` 通过环境变量注入，不写入仓库。

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. MVP 优先交付**：PASS — 仅接入必需依赖与最少抽象，mock 工具与真实大模型混合落地。
- **II. 核心路径正确性**：PASS — 覆盖对话、意图路由、建单权限、历史恢复四条核心链路。
- **III. 最小抽象**：PASS — 只在 `lib/agent` 暴露必要单例（agent + checkpointer + `getThreadMessages`）。
- **IV. 实用技术栈**：PASS — 严格使用 skill 约定依赖，不引入替代方案。

## Project Structure

### Documentation (this feature)

```text
specs/004-agent-mock-integration/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── agent-stream.md
└── tasks.md
```

### Source Code (repository root)

```text
app/
├── mobile/assistant/page.tsx            # RSC：预取历史 → 传给客户端组件
└── api/
    └── agent/route.ts                   # 单 SSE 路由，服务端 agent.stream(...)

components/agent/
├── agent-chat.tsx                       # 'use client'，包 useStream 与 UI
├── use-agent-chat.ts                    # 自定义 hook，封装 FetchStreamTransport + useStream
├── chat-message-list.tsx                # 基于 AI Elements 的消息流渲染
├── prompt-input-bar.tsx                 # 输入区 + 发送按钮
├── tool-call-card.tsx                   # queryTicket / knowledge_query 结果卡
└── create-ticket-card.tsx               # create_ticket HITL 卡（前端拦截方案）

lib/agent/
├── index.ts                             # 导出 agent 单例 + getThreadMessages(thread_id)
├── model.ts                             # ChatOpenAI(baseURL=OpenRouter)
├── tools.ts                             # queryTicket / knowledge_query / create_ticket
├── prompts.ts                           # 身份注入 + 行为边界 system prompt
└── checkpoints.ts                       # PostgresSaver 单例 + ensureCheckpointerReady()
```

**Structure Decision**:

- 服务端入口仅此一个 Next.js Route Handler：`app/api/agent/route.ts`；不使用 LangGraph Platform/Server。
- LangGraph 相关代码均作为 **Node.js 库** 被该 Route Handler 调用。
- Agent 与 checkpointer 在 `lib/agent` 中**模块级单例**，避免每次请求重复建表与建立连接池。

## Implementation Phases（对应 skill 的 4 步）

### Phase 0 — 依赖与环境就绪

1. 安装 skill 约定依赖：
   ```bash
   npm i langchain @langchain/core @langchain/langgraph @langchain/openai \
     @langchain/langgraph-checkpoint-postgres \
     @langchain/langgraph-sdk @langchain/react zod
   npx ai-elements@latest add conversation message prompt-input tool
   ```
2. 写入环境变量（OpenRouter + 真实 Supabase `DATABASE_URL` + 可选 LangSmith）。
3. 冻结范围：
   - 使用真实 OpenRouter 模型 `moonshotai/kimi-k2.5`。
   - 使用真实 Supabase Postgres 作为 checkpoint 后端。
   - 服务入口仅 Next.js API。
   - HITL 不使用 interrupt/resume（采用前端拦截 tool_call）。

### Phase 1 — 最小 Agent（对应 skill Step 1）

**后端（`app/api/agent/route.ts` + `lib/agent/*`）**：

- `ChatOpenAI({ configuration: { baseURL: OPENROUTER_BASE_URL }, apiKey: OPENROUTER_API_KEY, model: AGENT_MODEL_ID })`。
- `createAgent({ model, tools: [queryTicket, knowledgeQuery, createTicket] })`。
- Route Handler 核心：
  ```ts
  const stream = await agent.stream(
    { messages: [{ role: "user", content: text }] },
    { encoding: "text/event-stream", streamMode: ["messages", "values", "updates"], signal: req.signal },
  );
  return new Response(stream, { headers: { "Content-Type": "text/event-stream" } });
  ```

**前端（`components/agent/*` + `app/mobile/assistant/page.tsx`）**：

- `useAgentChat()` 用 `FetchStreamTransport({ apiUrl: "/api/agent" })` + `useStream({ transport, throttle: 50 })`。
- 消息流基于 AI Elements `conversation` / `message` / `prompt-input` / `tool` 组件渲染。
- 工具卡片用 `@langchain/langgraph-sdk/utils` 的 `getToolCallsWithResults(messages)` 将 `tool_calls` 与 `ToolMessage` 配对。

**验收**：输入文本后出现加载态 → 流式气泡 → 工具调用可折叠卡片。

### Phase 2 — 接入 `thread_id` + 真实 PostgresSaver（对应 skill Step 2）

**后端**：

- 在 `lib/agent/checkpoints.ts` 单例化：
  ```ts
  export const checkpointer = PostgresSaver.fromConnString(process.env.DATABASE_URL!);
  let setupPromise: Promise<void> | null = null;
  export function ensureCheckpointerReady() {
    setupPromise ??= checkpointer.setup();
    return setupPromise;
  }
  ```
- `createAgent({ model, tools, checkpointer })` 传入同一个单例。
- Route Handler：
  - 解析 `body.config.configurable.thread_id`，缺失返回 400。
  - 使用 `coerceMessageLikeToMessage`（`@langchain/core/messages`）规范化入参消息。
  - `agent.stream(input, { configurable: { thread_id }, streamMode: ["messages","values","updates"], ... })`。
- `thread_id` 来源：从 Supabase 服务端会话 `supabase.auth.getUser()` 取 `user.id`；前端若显式传入则必须与之匹配，否则 403/400。

**前端**：

- `useStream({ transport, threadId: userId, throttle: 50 })` — 由当前登录用户唯一 ID 注入 `config.configurable.thread_id`。
- 每次 `submit` 只发送新的一条 human 消息，历史由 `PostgresSaver` 合并。

### Phase 3 — 页面初始渲染历史对话（对应 skill Step 3）

**后端**（在 `lib/agent/index.ts` 暴露 RSC 可调用函数）：

```ts
export async function getThreadMessages(thread_id: string) {
  await ensureCheckpointerReady();
  const snapshot = await agent.getState({ configurable: { thread_id } });
  return snapshot.values.messages?.map(toMessageDict) ?? [];
}
```

失败时返回 `[]`，UI 降级为空会话。

**前端**：

- `app/mobile/assistant/page.tsx`（RSC）：
  - 从 `supabase.auth.getUser()` 拿到当前用户 `userId`。
  - `const initialMessages = await getThreadMessages(userId)`。
  - 将 `userId` 与 `initialMessages` 传给客户端 `<AgentChat />`。
- `useAgentChat(userId, initialMessages)` 调用 `useStream({ ..., threadId: userId, initialValues: { messages: initialMessages } })`。
- UI 降级：当 `stream.messages.length === 0` 时渲染 `initialMessages`。

### Phase 4 — 工具层落地（HITL 采用前端拦截方案）

严格按 spec 澄清：**不使用 `interrupt` / `Command.resume`**，Step 4 的 `interrupt` 路线在本阶段主动不落地。

`lib/agent/tools.ts` 定义三个工具（均为普通 `tool(...)`）：

1. **`queryTicket`**（mock）
   - `schema`: `z.object({ filter: z.string().optional() })`。
   - 返回硬编码工单列表，前端渲染结构化卡片。
2. **`knowledge_query`**（mock）
   - `schema`: `z.object({ question: z.string() })`。
   - 返回预设 Markdown 规范文本。
3. **`create_ticket`**（前端拦截）
   - `schema`: 描述、位置、严重程度、专业类型、责任人等。
   - 工具实现只返回“占位提示 + 需要前端确认”的结构化文本；真正的确认提交由前端卡片完成。
   - 在当前用户角色非「质检员」时，system prompt 明确禁止触发该 tool_call，同时工具内再做一层防御性短路（返回拒绝提示）。

## API Contract（Next.js Route Handler）

- **Route**: `POST /api/agent`
- **Content-Type**: `application/json`
- **Request 必备字段**：
  ```json
  {
    "messages": [{ "role": "user", "content": "..." }],
    "config": { "configurable": { "thread_id": "<当前登录用户ID>" } }
  }
  ```
- **Response**: `text/event-stream`，事件通道包括 `messages` / `values` / `updates`（`updates` 预留但当前阶段不消费 HITL）。
- **Auth**: 服务端必须用 `supabase.auth.getUser()` 校验；未登录返回 401；`thread_id ≠ user.id` 返回 403。

## Data & Database

- **真实数据库**：继续使用现有 Supabase Postgres 实例。
- **LangGraph checkpoint**：`PostgresSaver` 首次运行时 `setup()` 自动建表（`checkpoints`、`checkpoint_writes` 等）。
- **业务表**：本阶段不扩展 `tickets` / `ticket_logs`；`create_ticket` 确认后不落库，直接 mock 成功。
- **连接方式**：使用 Supabase 的 Transaction Pooler Direct URL（避免 Serverless 连接数爆炸）。

## Risks & Mitigations

| 风险 | 缓解 |
|---|---|
| Serverless 下 Postgres 连接抖动 | 使用 Transaction Pooler URL；checkpointer 模块级单例 |
| 首次 `setup()` 并发建表 | `ensureCheckpointerReady()` 共享 `Promise` |
| 模型响应慢/超时 | 前端显示错误气泡，用户手动重试；`AbortController` + `req.signal` 传到 `agent.stream` |
| 非质检员触发 `create_ticket` | System prompt 约束 + 工具内防御性拒绝 |
| `thread_id` 被伪造 | 服务端强制以 `supabase.auth.getUser()` 的 `user.id` 为准 |

## Complexity Tracking

当前无宪法违规项，无需复杂度豁免。
