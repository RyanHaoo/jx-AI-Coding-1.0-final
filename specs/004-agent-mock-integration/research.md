# Research - Agent 对话模块（Mock 实现）

## Decision 1: 会话持久化使用 LangGraph Postgres Checkpoint

- **Decision**: 使用 `PostgresSaver` 持久化对话状态；`thread_id` 直接取当前登录用户唯一 ID。  
- **Rationale**: 与已确认的 clarifications 一致，刷新可恢复历史，且无需自建历史拼接逻辑。  
- **Alternatives considered**:
  - 仅前端内存：刷新丢失，不满足已确认需求。
  - 仅 localStorage：跨端不可用，且后端无法复用历史上下文。

## Decision 2: create_ticket HITL 采用前端拦截普通 tool_call

- **Decision**: 大模型输出普通 `tool_call` 后，前端渲染创建卡片并回传确认结果；本阶段不使用 `interrupt/resume`。  
- **Rationale**: 与当前 spec 决策一致，交互可验证且实现复杂度最低。  
- **Alternatives considered**:
  - `interrupt`/`Command.resume`：更标准，但超出本阶段复杂度目标。

## Decision 3: API 只要求标准流式接口，不绑定固定契约

- **Decision**: 计划实现默认路由 `/api/agent`，但规范层面只承诺“标准流式接口”，不强制固定路由和固定请求体。  
- **Rationale**: 满足当前澄清结果，保留后续重构空间。  
- **Alternatives considered**:
  - 完全固定契约：更利于强约束，但与当前澄清结果不一致。

## Decision 4: 意图路由由真实大模型负责，工具层保持最简 mock

- **Decision**: 查询工单、知识问答、创建工单均由模型+prompt驱动意图判定，工具只返回 mock 数据。  
- **Rationale**: 覆盖核心链路，同时避免接入真实工单 API/知识平台。  
- **Alternatives considered**:
  - 关键词规则路由：不能验证真实模型分流能力。

## Decision 5: 身份上下文通过服务端获取并注入 System Prompt

- **Decision**: 使用 Supabase 服务端会话 + 身份 cookie，构建姓名/部门/角色/项目上下文注入 prompt。  
- **Rationale**: 直接支撑权限约束（如非质检员禁止创建工单）。  
- **Alternatives considered**:
  - 前端传角色：可被篡改，不符合服务端约束思路。
