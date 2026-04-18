# Phase 0 Research: Agent 工单查询 MCP 接入

**Feature**: 006-agent-ticket-query-mcp  
**Date**: 2026-04-18  
**Status**: Complete — Technical Context 中的关键决策均已收敛，无残留 NEEDS CLARIFICATION。

---

## Decision 1：MCP 传输采用本地 stdio 单进程

- **Decision**: `query_ticket` 通过本地 `stdio` MCP server 暴露，Agent 进程内以 `MultiServerMCPClient` 连接该 server。
- **Rationale**:
  - 规格已明确本次仅做单工具查询，`stdio` 是最小部署形态，不需要额外网关或服务。
  - 与当前 Next.js Node runtime 同机运行，便于复用现有环境变量与日志链路。
  - 冷启动开销可控，符合 <=1.5s 目标。
- **Alternatives considered**:
  - `http/sse` MCP：引入额外服务管理与网络层故障面，超出本期范围。
  - 直接去掉 MCP、在 tool 内直连 Supabase：与本次“工单查询 MCP 开发和接入”目标不符。

## Decision 2：鉴权上下文来自当前用户 session access token

- **Decision**: 在 `app/api/agent/route.ts` 使用当前请求的 Supabase session 获取 `access_token`，通过 `RunnableConfig.configurable` 透传给 `queryTicket` 包装器，包装器再注入到 MCP 调用参数。
- **Rationale**:
  - 满足“使用当前用户身份调用 Supabase API”的已澄清约束。
  - 避免服务角色密钥带来的越权风险，权限边界交由 RLS 自然收敛。
  - token 生命周期与用户会话一致，语义清晰。
- **Alternatives considered**:
  - service role 统一查询再应用业务过滤：安全风险高，且不符合已锁定决策。
  - 直接把 token 放到模型可见参数：存在泄漏风险，不可接受。

## Decision 3：token 仅作运行时透传，不落盘到 checkpoint

- **Decision**: `supabase_access_token` 仅放在本次 `agent.stream` 的 `configurable` 中，工具读取后即时使用，不写入消息历史或 checkpoint state。
- **Rationale**:
  - 避免敏感凭证进入 Postgres 持久层。
  - 与现有 LangGraph checkpoint 设计兼容，不需要修改消息结构。
- **Alternatives considered**:
  - 将 token 作为隐藏系统消息传递：会进入历史消息链，不满足安全要求。
  - 在 tool 全局变量缓存 token：并发用户下存在串号风险。

## Decision 4：`query_ticket` 入参改为结构化过滤字段

- **Decision**: 对模型公开的参数为 `status` / `severity` / `specialty_type` / `keyword` / `limit`（默认 10，最大 50），不再使用自由文本 `filter`。
- **Rationale**:
  - 结构化字段降低模型幻觉与错误查询比例。
  - 与现有 `tickets` 表可直接映射，便于 server 端做白名单过滤。
- **Alternatives considered**:
  - 继续使用自然语言 `filter`：解析不稳定且不可测试。
  - 暴露更多复杂参数（分页、排序字段）：超出 MVP 范围。

## Decision 5：返回“摘要字段 + 截断标记”控制上下文成本

- **Decision**: MCP 返回紧凑 JSON 文本，仅含 `id/status/severity/description/location/created_at/assignee.name/project.name`，并在超限时返回 `truncated: true`。
- **Rationale**:
  - 避免将 `images/detail/root_cause` 等大字段写入对话上下文造成 token 浪费。
  - 截断标记可引导 Agent 继续追问筛选条件，提升结果可用性。
- **Alternatives considered**:
  - 返回完整工单对象：上下文体积过大，影响响应速度与可读性。
  - 超限直接报错：会破坏查询主路径体验。

## Decision 6：MCP 客户端采用模块级单例，避免重复冷启动

- **Decision**: 新增 `lib/agent/mcp-client.ts` 管理 `MultiServerMCPClient` 与 `query_ticket` tool 获取，使用惰性单例复用连接。
- **Rationale**:
  - 避免每次请求都新建子进程，降低响应抖动。
  - 符合最小抽象：单文件承担 MCP 生命周期管理，不扩展额外层级。
- **Alternatives considered**:
  - 每次工具调用临时起 MCP server：性能不可控。
  - 在 `lib/agent/tools.ts` 顶层 await 初始化：错误恢复能力弱、测试困难。

---

## Outstanding NEEDS CLARIFICATION

无。
