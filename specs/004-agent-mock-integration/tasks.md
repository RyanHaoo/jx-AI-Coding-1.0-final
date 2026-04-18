---

description: "Task list for Agent 对话模块（Mock 实现）"
---

# Tasks: Agent 对话模块（Mock 实现）

**Input**: Design documents from `/specs/004-agent-mock-integration/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/agent-stream.md, quickstart.md

**Tests**: 未请求测试任务；按宪法「MVP 优先，不写测试」原则，仅通过 `tsc --noEmit` + `biome check` + quickstart 手动验收。

**Organization**: 按用户故事组织，P1 → P2 → P3。

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 可并行（不同文件、无未完成依赖）
- **[Story]**: 归属的用户故事（US1 / US2 / US3 / US4 / US5）
- 所有任务必须给出准确文件路径

## Path Conventions

本项目为单仓 Next.js App Router 结构：

- 前端页面：`app/...`
- API 路由：`app/api/agent/route.ts`
- 客户端组件：`components/agent/*`
- Agent / 工具 / 持久化：`lib/agent/*`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: 安装 skill 约定依赖、添加 AI Elements 组件、配置环境变量、预置目录骨架。

- [x] T001 按 `create-next-langchain-agent` 安装依赖：在仓库根执行 `npm i langchain @langchain/core @langchain/langgraph @langchain/openai @langchain/langgraph-checkpoint-postgres @langchain/langgraph-sdk @langchain/react zod`，更新 `package.json` / `package-lock.json` _(MVP 完成)_
- [x] T002 [P] 添加 AI Elements 组件：`npx ai-elements@latest add conversation message prompt-input tool`（组件安装到项目既有 `components/ui` 体系） _(MVP 完成；`tool` 先未添加，后续 US2 再加)_
- [x] T003 [P] 在 `.env.example` 中补充 `OPENROUTER_BASE_URL` / `OPENROUTER_API_KEY` / `AGENT_MODEL_ID` / `DATABASE_URL` / 可选 LangSmith 变量；要求 `DATABASE_URL` 指向真实 Supabase Transaction Pooler URL _(MVP 完成；DATABASE_URL/LangSmith 以注释形式保留等 Phase 2 启用)_
- [x] T004 创建目录骨架（先放占位文件即可）：`lib/agent/`（`index.ts`、`model.ts`、`prompts.ts`、`tools.ts`、`checkpoints.ts`）、`components/agent/`、`app/api/agent/` _(MVP 完成；`prompts.ts` / `tools.ts` / `checkpoints.ts` 尚未创建占位，留到对应阶段)_

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 搭起「真实 Postgres checkpoint + Next.js API SSE 路由 + thread_id 强一致 + RSC 预取历史」的核心骨架，后续所有用户故事都基于此扩展。

**⚠️ CRITICAL**: 以下未完成，任何 US 任务都无法独立验证。

- [x] T005 实现 `lib/agent/checkpoints.ts`：`PostgresSaver.fromConnString(process.env.DATABASE_URL!)` 模块级单例；导出 `ensureCheckpointerReady()`（共享 `Promise`，内部调用 `checkpointer.setup()`）；缺少环境变量时抛错
- [x] T006 [P] 实现 `lib/agent/model.ts`：使用 `ChatOpenAI({ model: process.env.AGENT_MODEL_ID, apiKey: process.env.OPENROUTER_API_KEY, configuration: { baseURL: process.env.OPENROUTER_BASE_URL } })` 返回模型单例 _(MVP 完成)_
- [x] T007 [P] 实现 `lib/agent/prompts.ts`：导出 `buildSystemPrompt(identity)` 构建身份上下文 + 行为边界 system prompt（字段见 data-model.md 的 `IdentityContextForPrompt`）；此阶段仅输出基础骨架，US5 会继续扩展 _(与 US5 合并一次交付)_
- [x] T008 实现 `lib/agent/index.ts`：基于 T005/T006 组合 `createAgent({ model, tools: allTools, checkpointer })` 单例（含 queryTicket / knowledge_query / create_ticket）；并导出 `getThreadMessages(threadId)` / `trimToLastNRounds` / `pruneThreadIfExceeded`
- [x] T009 实现 `app/api/agent/route.ts`：
  1. `await supabase.auth.getUser()`，未登录返回 401；
  2. 读取身份 cookie，缺失返回 403；
  3. 读取 `body.config.configurable.thread_id`，若与 `user.id` 不一致返回 403；服务端统一以 `user.id` 为准；
  4. 从 `profiles` 查询姓名/部门，组合 `IdentityContextForPrompt`，`buildSystemPrompt` 作为首条 `SystemMessage`（`id = SYSTEM_PROMPT_ID`，基于 `add_messages` reducer 去重）注入；
  5. `await ensureCheckpointerReady()` + `pruneThreadIfExceeded()`（6 轮截断）；
  6. `body.input.messages` 经 `coerceMessageLikeToMessage` 规范化；
  7. `agent.stream` SSE 透传。_MVP 偏差：均已收口_
- [x] T010 实现 `components/agent/use-agent-chat.ts`：`'use client'`；`useMemo` 构造 `new FetchStreamTransport({ apiUrl: "/api/agent" })`；返回 `useStream({ transport, threadId: userId, initialValues: { messages: initialMessages }, throttle: 50 })`；签名 `useAgentChat({ userId, initialMessages })`
- [x] T011 重写 `app/mobile/assistant/page.tsx` 为 RSC：`await supabase.auth.getUser()` 得 `userId`；`const initialMessages = await getThreadMessages(userId)`；渲染 `<AgentChat userId={userId} initialMessages={initialMessages} />`；未登录跳 `/login`

**Checkpoint**: 基础路由可被任意 US 扩展；前端基座已就绪。

---

## Phase 3: User Story 1 - 智能助手对话界面（Priority: P1） 🎯 MVP

**Goal**: 在 `/mobile/assistant` 跑通「文本发送 → 加载态 → 流式回复 → 欢迎语首屏 → 禁用输入态」的最小对话链路。

**Independent Test**: 打开 `/mobile/assistant`，输入任意文字，观察到消息发送、加载态、流式回复气泡出现；加载期间输入区禁用；首屏显示欢迎语。

- [x] T012 [P] [US1] 实现 `components/agent/chat-message-list.tsx`：基于 AI Elements 的 `conversation` / `message` 组件渲染 `messages`；兼容 `HumanMessage.isInstance` / `AIMessage.isInstance` 与 `type === "human" | "ai"` 的 dict 形态；空态时渲染 `initialMessages`（`stream.messages.length === 0` 时） _(MVP 完成：消息列表合并进 `agent-chat.tsx`，未拆单独文件；仅处理 dict 形态)_
- [x] T013 [P] [US1] 实现 `components/agent/prompt-input-bar.tsx`：基于 AI Elements `prompt-input`；包含 `+` 占位按钮、文本框、发送按钮；受控 `disabled` 属性；回车提交 _(MVP 完成：输入区合并进 `agent-chat.tsx`；`+` 占位按钮暂未加)_
- [x] T014 [US1] 实现 `components/agent/agent-chat.tsx`：`'use client'`，props `{ userId: string; initialMessages: unknown[] }`；调用 `useAgentChat(userId, initialMessages)`；组合 `ChatMessageList` + `PromptInputBar`；按 `isLoading` 控制输入禁用；`submit({ messages: [new HumanMessage(text)] }, { optimisticValues: { messages: [...prev, human] } })` _(MVP 完成：无 props；`submit` 传 dict `{ type: "human", content }`)_
- [x] T015 [US1] 在 `lib/agent/prompts.ts` 增加欢迎语生成规则（system prompt 指示：会话开启时主动给一条中文欢迎语）；在 `AgentChat` 中当 `stream.messages.length === 0 && initialMessages.length === 0` 时直接渲染一条本地占位欢迎语作为 UI 降级 _(MVP 完成：仅使用 `ConversationEmptyState` 渲染本地占位欢迎语；system prompt 留到 Phase 2+)_
- [x] T016 [US1] 按 `quickstart.md` 步骤 1–2 手动验收，首 token ≤ 3s；确认 `biome check` + `tsc --noEmit` 通过 _(MVP 完成：`tsc --noEmit` 通过；新代码 `biome check` 无问题，仅 AI Elements/shadcn 自动生成组件存在 lint 告警；首 token 人工验收在补好 `.env` 后进行)_

**Checkpoint**: US1 可独立验证（工具链路尚未接入，此时模型应只走文本对话）。

---

## Phase 4: User Story 2 - 工单查询 Mock（Priority: P2）

**Goal**: 用户提工单相关意图时，模型调用 mock `queryTicket`，返回结构化工单列表并以工具卡片形式渲染。

**Independent Test**: 对话中输入「查一下我的工单」，看到结构化工单列表卡片；输入无匹配条件问句时显示空态提示。

- [x] T017 [P] [US2] 在 `lib/agent/tools.ts` 新增 `queryTicket`：`tool(async () => "mock success", { name: "queryTicket", schema: z.object({ filter: z.string().optional() }) })` _(按最新要求所有 mock 仅返回 "mock success")_
- [x] T018 [US2] 修改 `lib/agent/index.ts` 的 `createAgent` 的 `tools` 数组，注册 `queryTicket`（与 US3 / US4 合并一次性注册 `allTools`）
- [x] T019 [P] [US2] 实现 `components/agent/tool-call-card.tsx`：`'use client'`；渲染最简工具卡（调用中 / 完成），完成态展示 `mock success` 字符串。_MVP 偏差：未使用 AI Elements `tool` 组件，手写最小卡片_
- [x] T020 [US2] 在 `agent-chat.tsx` 中根据 `tool_calls[].id` 与 `ToolMessage.tool_call_id` 配对渲染，`queryTicket` 走 `ToolCallCard`
- [x] T021 [US2] 空结果处理由模型自然语言占位回复承担；quickstart 步骤 3 需配合真实 `DATABASE_URL` 手动验收

**Checkpoint**: US1 + US2 均可独立工作。

---

## Phase 5: User Story 5 - 意图路由（Priority: P2）

**Goal**: 由真实大模型基于 system prompt 和身份上下文完成意图路由（知识/查询/建单/超范围）。

**Independent Test**: 依次输入知识类、工单查询类、创建工单类、与质检无关的话题，验证路由结果各自正确；与质检无关时，模型礼貌拒答。

- [x] T022 [US5] 扩展 `lib/agent/prompts.ts`：在 `buildSystemPrompt(identity)` 中加入「意图路由规则」段落（知识走 `knowledge_query`、查询走 `queryTicket`、建单走 `create_ticket`、超范围直接拒答），并声明「混合意图时先知识再建单」
- [x] T023 [US5] 在 `app/api/agent/route.ts` 中完成身份上下文拼装：从 Supabase 查询 `profiles`（姓名、部门）+ 身份 cookie（projectId、projectName、role），组合成 `IdentityContextForPrompt` 注入 system prompt
- [x] T024 [US5] `prompts.ts` 中补齐超范围拒答规则 + 非质检员建单拒答规则（不调用工具）

**Checkpoint**: US5 生效后，后续 US3/US4 只需提供工具实现与 UI，无需再改路由逻辑。

---

## Phase 6: User Story 4 - 知识问答 Mock（Priority: P3）

**Goal**: 知识类输入触发 mock `knowledge_query`，返回 Markdown 并正确渲染。

**Independent Test**: 输入「混凝土强度等级有哪些要求」，看到带标题/加粗/列表的 Markdown 答复。

- [x] T025 [P] [US4] 在 `lib/agent/tools.ts` 新增 `knowledge_query`：`schema: z.object({ question: z.string() })`；返回 `"mock success"` _(按最新要求)_
- [x] T026 [US4] 注册到 `createAgent` 的 `allTools`
- [x] T027 [US4] `knowledge_query` 结果走通用 `ToolCallCard`；Markdown 分支留待后续真数据接入 _(本阶段仅 mock success，无需 Markdown 渲染)_
- [x] T028 [US4] `tsc --noEmit` + `biome check` 通过

**Checkpoint**: US4 可独立验证。

---

## Phase 7: User Story 3 - 工单创建 HITL Mock（Priority: P3）

**Goal**: 大模型触发 `create_ticket` 普通 tool_call 后，前端拦截并渲染编辑卡片；用户确认后卡片切换只读、模型回复「工单已创建成功」。本阶段不调用真实 API，不使用 `interrupt/resume`。

**Independent Test**: 质检员身份输入「3 号楼 5 层卫生间漏水」，出现可编辑卡片；填责任人后确认 → 卡片变只读、消息流出现成功回复；切换为施工方/管理员身份重复操作，模型拒绝、不渲染卡片。

- [x] T029 [P] [US3] 在 `lib/agent/tools.ts` 新增 `create_ticket`：完整 schema，工具实现返回 `"mock success"`
- [x] T030 [US3] 防御由 `buildSystemPrompt` 中的角色约束承担（非质检员禁止调用 `create_ticket`、缺参数先追问）；工具内无需再短路 _(最新要求：简化处理)_
- [x] T031 [US3] `create_ticket` 注册到 `allTools`；`buildSystemPrompt` 中已写入「非质检员拒答」「缺失必填参数先追问」规则
- [x] T032 [P] [US3] 实现 `components/agent/create-ticket-card.tsx`：纯展示卡 + 一个「提交工单」按钮（无点击逻辑） _(最新要求：只渲染展示卡与占位按钮)_
- [x] T033 [US3] 在 `agent-chat.tsx` 中根据 `tool_calls[].name === "create_ticket"` 替换为 `CreateTicketCard`
- [~] T034 [US3] 用户点击「确认提交」的 `submit(ToolMessage)` 回灌逻辑与成功回读 _(最新要求：提交按钮无逻辑，暂不实现)_
- [~] T035 [US3] 非质检员 UI 兜底 _(简化方案：全部交给 system prompt 层的拒答规则，UI 不再双重判断)_
- [x] T036 [US3] `tsc --noEmit` + `biome check` 通过

**Checkpoint**: 所有 US 均可独立验证。

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: 收口 spec 中跨故事的非功能项（过程提示、6 轮截断、错误气泡、文档同步、最终回归）。

- [x] T037 [P] `tool-call-card.tsx` 中渲染「调用中 / 已完成」过程提示（基于 `ToolMessage` 是否已匹配到 `tool_call_id`）
- [x] T038 在 `app/api/agent/route.ts` 中实现 6 轮截断：`pruneThreadIfExceeded` 通过 `agent.getState` + `RemoveMessage` 在 stream 前回写
- [x] T039 [P] 在 `components/agent/agent-chat.tsx` 中处理 `useStream` 的 `error`：显示错误气泡（红色文字）
- [x] T040 [P] 更新 `CLAUDE.md` 的「Active Technologies / Recent Changes」加入本 feature 的依赖与环境变量
- [x] T041 运行 `npx biome check --write` 与 `npx tsc --noEmit`，修复所有阻断项（新文件零错误）
- [~] T042 按 `specs/004-agent-mock-integration/quickstart.md` 逐项回归 8 步验收 _(需要用户补齐 `.env` 后手动执行)_

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 Setup**：无依赖
- **Phase 2 Foundational**：依赖 Phase 1；阻塞所有 US
- **Phase 3 US1 (P1)**：依赖 Phase 2
- **Phase 4 US2 (P2)**：依赖 Phase 2；建议在 US1 后验证
- **Phase 5 US5 (P2)**：依赖 Phase 2；为 US3/US4 的模型分流铺路（强烈建议在 US3/US4 之前完成）
- **Phase 6 US4 (P3)**：依赖 Phase 2 + Phase 5（为保证意图路由正确命中）
- **Phase 7 US3 (P3)**：依赖 Phase 2 + Phase 5
- **Phase 8 Polish**：依赖所有目标 US 完成

### User Story Dependencies

- **US1 (P1)**：无故事依赖
- **US2 (P2)**：功能独立；需要 Phase 2 的工具注册入口
- **US5 (P2)**：独立生效；完成后显著提升 US3/US4 的稳定性
- **US4 (P3)**：独立；强烈建议在 US5 之后
- **US3 (P3)**：独立；强烈建议在 US5 之后

### Within Each User Story

- 工具（`lib/agent/tools.ts`）→ 注册（`lib/agent/index.ts`）→ 前端卡片（`components/agent/*`）→ 组装（`agent-chat.tsx` / `chat-message-list.tsx`）→ 验收

---

## Parallel Opportunities

- **Phase 1**：T002、T003 可与 T001 完成后并行
- **Phase 2**：T006、T007 可在 T005 后并行；T008 依赖 T005–T007；T010 与 T011 可在 T009 之后并行
- **US1**：T012、T013 可并行；T014 依赖二者
- **US2**：T017 与 T019 可并行（不同文件）；T018/T020/T021 串行
- **US4**：T025 可与 US3 的 T029/T032 并行（不同文件）
- **Polish**：T037、T039、T040 可并行；T041、T042 串行收尾

---

## Parallel Example: User Story 1

```bash
# 两个组件文件可同时启动（不同文件、无依赖）：
Task: "Implement components/agent/chat-message-list.tsx per AI Elements spec"
Task: "Implement components/agent/prompt-input-bar.tsx with disabled prop"
# 完成后再做 agent-chat.tsx 聚合（依赖两者）
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. 完成 Phase 1 Setup
2. 完成 Phase 2 Foundational
3. 完成 Phase 3 US1
4. **停下来按 quickstart 步骤 1–2 验证**（含刷新恢复）
5. 若通过即可 demo（纯对话 + 持久化）

### Incremental Delivery

1. Setup + Foundational → 基座就绪
2. US1 → 验收 → demo
3. US2 → 验收 → demo
4. US5 → 验收（分流稳定性）
5. US4 → 验收 → demo
6. US3 → 验收 → demo
7. Polish → 回归

### Parallel Team Strategy

- 一人完成 Phase 1+2 基座
- 基座完成后：A 做 US1、B 做 US2、C 做 US5
- 随后 D 做 US4、E 做 US3（强烈建议 US5 先于 US3/US4）

---

## Notes

- [P] 任务 = 不同文件、无依赖
- 不生成测试任务；所有验收通过 `biome check` + `tsc --noEmit` + quickstart 手动回归
- `thread_id` 在服务端以 `supabase.auth.getUser().id` 为准，前端传参必须与之一致
- 本阶段 HITL 严格走「前端拦截普通 tool_call」路线；不引入 `interrupt` / `Command.resume`
- 服务入口只有一个：`app/api/agent/route.ts`（Next.js API 路由），不部署 LangGraph Platform/Server
- 每完成一个 Phase 或检查点建议 commit 一次
