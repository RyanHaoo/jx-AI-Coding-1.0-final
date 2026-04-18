# Tasks: Agent 工单查询 MCP 接入

**Input**: Design documents from `/specs/006-agent-ticket-query-mcp/`  
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/query-ticket-tool.md, quickstart.md

**Tests**: 根据宪法与 spec，本特性不新增自动化测试任务；验收通过 `quickstart.md` 手工链路验证 + `npx tsc --noEmit` + `npm run lint`。  
**Organization**: 任务按用户故事分组，保证每个故事可独立实现与验证。

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 可并行执行（不同文件、无前置未完成依赖）
- **[Story]**: 用户故事标签（US1/US2/US3）
- 每条任务都包含明确文件路径

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: 建立本 feature 的最小脚手架与目录

- [x] T001 创建 MCP 目录与服务文件骨架 `mcp/ticket-query-server.mjs`
- [x] T002 创建 MCP 客户端封装文件骨架 `lib/agent/mcp-client.ts`
- [x] T003 创建任务文档引用更新（将 feature 文档列表补齐）`specs/006-agent-ticket-query-mcp/plan.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 完成所有用户故事共享的底层能力（未完成前禁止进入故事实现）

- [x] T004 在 `mcp/ticket-query-server.mjs` 实现 MCP server 初始化与 `query_ticket` 工具注册
- [x] T005 [P] 在 `mcp/ticket-query-server.mjs` 实现 Supabase 客户端创建（基于 `supabase_access_token`）与 RLS 查询执行
- [x] T006 [P] 在 `mcp/ticket-query-server.mjs` 实现输入校验（枚举字段、keyword 归一化、limit 默认值与上限）
- [x] T007 在 `mcp/ticket-query-server.mjs` 实现输出收敛（摘要字段映射、`total` 与 `truncated` 语义）
- [x] T008 在 `lib/agent/mcp-client.ts` 实现 `MultiServerMCPClient` 单例与 `query_ticket` tool 获取函数
- [x] T009 在 `lib/agent/index.ts` 重构 Agent 初始化为可异步装配 MCP tools 的模式
- [x] T010 在 `lib/agent/tools.ts` 保留 `knowledge_query` 与 `create_ticket` mock 并拆分 `queryTicket` 包装器入口

**Checkpoint**: MCP server + MCP client + Agent 组装链路可用，用户故事可开始

---

## Phase 3: User Story 1 - 当前身份下查询待处理工单 (Priority: P1) 🎯 MVP

**Goal**: 将“查询工单”意图从 mock 响应替换为真实 MCP 查询结果  
**Independent Test**: 登录并选择身份后，在 `/mobile/assistant` 发送“有哪些待处理工单”，返回当前项目工单摘要列表

### Implementation for User Story 1

- [x] T011 [US1] 在 `lib/agent/tools.ts` 实现 `queryTicket` 调用 `query_ticket` MCP 工具并解析返回文本
- [x] T012 [US1] 在 `lib/agent/index.ts` 将 `queryTicket` 包装器与 MCP tools 合并进 Agent 工具列表
- [x] T013 [US1] 在 `app/api/agent/route.ts` 获取当前 session 的 `access_token` 并通过 `configurable.supabase_access_token` 透传
- [x] T014 [US1] 在 `app/api/agent/route.ts` 保持 `thread_id` 与系统提示注入逻辑不变，仅追加 token 透传字段
- [x] T015 [US1] 在 `specs/006-agent-ticket-query-mcp/quickstart.md` 回填 US1 验收记录步骤（主流程查询）

**Checkpoint**: US1 独立可用，MVP 可演示

---

## Phase 4: User Story 3 - 越权与未登录保护 (Priority: P1)

**Goal**: 确保跨项目不泄漏数据，未登录/失效会话下返回受控错误  
**Independent Test**: 同账号切换项目身份后执行同查询，结果仅含当前项目数据；会话失效后提示重新登录

### Implementation for User Story 3

- [x] T016 [US3] 在 `mcp/ticket-query-server.mjs` 实现未提供 token 时的受控错误返回（`UNAUTHENTICATED`）
- [x] T017 [US3] 在 `lib/agent/tools.ts` 将 MCP 受控错误映射为 Agent 可读中文失败提示
- [x] T018 [US3] 在 `app/api/agent/route.ts` 处理 session 缺失场景，确保不触发带空 token 的 MCP 调用
- [x] T019 [US3] 在 `specs/006-agent-ticket-query-mcp/quickstart.md` 补充跨项目隔离与未登录降级验收记录

**Checkpoint**: US3 独立可验收，权限边界清晰

---

## Phase 5: User Story 2 - 按条件筛选工单 (Priority: P2)

**Goal**: 支持结构化筛选与上限截断，提升查询可用性  
**Independent Test**: 发送带状态/严重程度/limit 条件的查询，返回结果满足筛选且正确截断

### Implementation for User Story 2

- [x] T020 [US2] 在 `lib/agent/tools.ts` 将原 `filter` 入参改为 `status/severity/specialty_type/keyword/limit` 的结构化 schema
- [x] T021 [US2] 在 `mcp/ticket-query-server.mjs` 实现组合过滤（status + severity + specialty_type + keyword）
- [x] T022 [US2] 在 `mcp/ticket-query-server.mjs` 实现 limit 截断逻辑并返回 `truncated` 标记
- [x] T023 [US2] 在 `specs/006-agent-ticket-query-mcp/contracts/query-ticket-tool.md` 更新最终输入输出示例与边界说明

**Checkpoint**: US2 独立可验收，筛选与截断行为稳定

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: 跨故事收尾、质量检查与文档同步

- [x] T024 [P] 运行并记录类型检查结果 `npx tsc --noEmit`（记录到 `specs/006-agent-ticket-query-mcp/quickstart.md`）
- [x] T025 [P] 运行并记录 lint 结果 `npm run lint`（记录到 `specs/006-agent-ticket-query-mcp/quickstart.md`）
- [x] T026 在 `CLAUDE.md` 的 Recent Changes/Active Technologies 更新本 feature 的最终落地说明
- [x] T027 执行 `specs/006-agent-ticket-query-mcp/quickstart.md` 的 5 个手工验收场景并回填结果

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: 无依赖，可立即开始
- **Phase 2 (Foundational)**: 依赖 Phase 1 完成；阻塞全部用户故事
- **Phase 3 (US1)**: 依赖 Phase 2；作为 MVP 主路径优先实现
- **Phase 4 (US3)**: 依赖 Phase 3（需要复用已接入的查询链路）
- **Phase 5 (US2)**: 依赖 Phase 3（在已可查询基础上扩展筛选）
- **Phase 6 (Polish)**: 依赖目标用户故事完成

### User Story Dependencies

- **US1 (P1)**: 无故事级前置依赖（仅依赖 Foundational）
- **US3 (P1)**: 依赖 US1 的查询链路完成后进行安全收敛
- **US2 (P2)**: 依赖 US1 的查询链路完成后扩展参数与过滤

### Parallel Opportunities

- Phase 2 中 `T005` 与 `T006` 可并行（同文件不同逻辑段，完成后合并）
- US1 完成后，US3 与 US2 可由不同开发者并行推进
- Phase 6 的 `T024` 与 `T025` 可并行执行

---

## Parallel Example: User Story 3

```bash
Task: "T016 [US3] 在 mcp/ticket-query-server.mjs 实现未提供 token 时的受控错误返回"
Task: "T017 [US3] 在 lib/agent/tools.ts 将 MCP 受控错误映射为 Agent 可读中文失败提示"
```

## Parallel Example: User Story 2

```bash
Task: "T021 [US2] 在 mcp/ticket-query-server.mjs 实现组合过滤"
Task: "T023 [US2] 在 specs/006-agent-ticket-query-mcp/contracts/query-ticket-tool.md 更新最终输入输出示例"
```

---

## Implementation Strategy

### MVP First (US1 Only)

1. 完成 Phase 1 + Phase 2
2. 完成 Phase 3（US1）
3. 立即执行独立验收（主流程查询）
4. 达标后可先演示，再继续安全与筛选增强

### Incremental Delivery

1. 基础链路：Setup + Foundational
2. 交付 US1：真实查询替换 mock（MVP）
3. 交付 US3：权限与未登录保护收敛
4. 交付 US2：筛选和截断增强
5. 最后执行 Phase 6 跨故事收尾

### Parallel Team Strategy

1. 一名开发者先完成 Phase 1/2/3
2. 之后并行：
   - 开发者 A：US3 安全与错误处理
   - 开发者 B：US2 筛选参数与截断
3. 共同完成 Phase 6 质量收尾
