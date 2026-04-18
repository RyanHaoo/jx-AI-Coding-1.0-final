# Phase 0 Research: Coze Subagent 工具集成

**Feature**: 006-coze-subagent  
**Date**: 2026-04-18  
**Status**: Complete — Technical Context 中的关键决策均已落地，无残留 NEEDS CLARIFICATION。

---

## Decision 1：替换并重命名现有 `knowledge_query`，不新增平行工具

- **Decision**: 直接替换 `lib/agent/tools.ts` 中的 `knowledgeQuery` mock 实现，并将工具名升级为更语义化名称（规划名：`consult_construction_knowledge`）。
- **Rationale**:
  - 用户已明确要求“重命名并替换”，避免主 agent 在多个知识工具间产生路由歧义。
  - 单一知识工具更符合 MVP“核心路径唯一化”原则。
- **Alternatives considered**:
  - 保留原 `knowledge_query` 再新增 `coze_knowledge`：增加提示词路由复杂度，且不符合当前明确需求。

## Decision 2：Coze 调用采用 `chat.stream`，工具层只聚合最终回答文本

- **Decision**: 使用 `@coze/api` 的流式接口获取子流程事件，但在工具内只提取最终 answer 内容并返回纯文本。
- **Rationale**:
  - 用户明确要求“不把 subagent 中间消息和状态提交给主 agent 和前端”。
  - 主 agent 与前端当前已经依赖 LangChain 自身流协议，返回纯文本可最小侵入接入。
- **Alternatives considered**:
  - 改用非流式一次性接口：实现更简单，但无法良好支持中断取消与后续扩展。
  - 返回结构化对象（answer + references）：超出已确认范围（当前只要 answer）。

## Decision 3：`user_id` 统一复用当前登录用户 `user.id`

- **Decision**: 通过现有鉴权流程获取的 `supabase.auth.getUser().data.user.id` 作为 Coze 请求 `user_id`。
- **Rationale**:
  - 现有 `/api/agent` 已以 `user.id` 作为 `thread_id`，身份链路稳定一致。
  - 避免新增映射表或匿名用户策略。
- **Alternatives considered**:
  - 使用随机 UUID：会破坏可追踪性，且难以关联平台用户行为。
  - 使用项目身份 cookie 中的 role/project 拼接：会引入额外格式约束，无明确收益。

## Decision 4：失败降级采用“可读错误文本返回”，而非抛出中断异常

- **Decision**: Coze 鉴权失败、超时、网络异常时，工具返回用户可读文本（由主 agent转述），不抛出未捕获错误。
- **Rationale**:
  - Spec FR-008 明确要求对话不中断。
  - 当前前端已经支持工具调用完成态展示，返回文本可无缝融入现有 UX。
- **Alternatives considered**:
  - 直接 throw error：会导致 agent 链路报错，破坏对话连续性。
  - 静默吞错返回空字符串：用户无感知，体验不可接受。

## Decision 5：取消信号沿用请求级 `AbortSignal` 透传

- **Decision**: 使用 `route.ts` 中现有 `req.signal` 语义，在工具调用 Coze 时透传取消信号。
- **Rationale**:
  - 现有主 agent stream 已挂接 `req.signal`，语义一致。
  - 能满足 SC-004 中“用户中断后快速停止”目标。
- **Alternatives considered**:
  - 工具内部忽略取消：会导致请求资源浪费与“幽灵响应”风险。

## Decision 6：按用户指令忽略 edge case 深入设计

- **Decision**: 规划阶段不对空答案修复、超长截断策略、多轮追问策略做扩展方案，仅定义主路径行为。
- **Rationale**:
  - 用户明确输入“忽略 edge case”。
  - 宪法强调 MVP 与核心路径优先。
- **Alternatives considered**:
  - 在本期补齐全量边界策略：会扩大范围并延后主功能交付。

---

## Outstanding NEEDS CLARIFICATION

无。
