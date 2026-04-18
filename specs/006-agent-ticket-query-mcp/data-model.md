# Phase 1 Data Model: Agent 工单查询 MCP 接入

**Feature**: 006-agent-ticket-query-mcp  
**Date**: 2026-04-18  
**Status**: Complete — 本阶段不新增数据库 schema，仅定义查询输入输出模型与运行时上下文模型。

---

## 数据源总览

本功能复用既有 Supabase 表与 RLS 策略：

- `tickets`（主表）
- `profiles`（责任人展示字段）
- `projects`（项目展示字段）

数据库结构与策略不变；仅新增 MCP 查询读取路径。

---

## 运行时实体

### 1) QueryTicketInput（模型可见参数）

| 字段 | 类型 | 必填 | 默认 | 约束 |
|------|------|------|------|------|
| `status` | `"待处理" \| "已完成" \| "已拒绝"` | 否 | - | 仅允许三种状态值 |
| `severity` | `"轻微" \| "一般" \| "严重" \| "紧急"` | 否 | - | 仅允许四种严重级别 |
| `specialty_type` | `"建筑设计专业" \| "结构专业" \| "给排水专业"` | 否 | - | 仅允许三种专业类型 |
| `keyword` | `string` | 否 | - | 空白字符串按未提供处理 |
| `limit` | `number` | 否 | `10` | `1 <= limit <= 50` |

说明：该实体由 `query_ticket` 工具 schema 暴露给模型，避免自由文本过滤。

### 2) QueryTicketRuntimeContext（模型不可见参数）

| 字段 | 类型 | 来源 | 约束 |
|------|------|------|------|
| `supabase_access_token` | `string` | `app/api/agent/route.ts` 中当前登录用户 session | 不落盘、不进入 messages/checkpoint |

说明：该字段仅用于 MCP server 内创建用户态 Supabase client。

### 3) TicketSummaryItem（查询结果项）

| 字段 | 类型 | 来源 |
|------|------|------|
| `id` | `number` | `tickets.id` |
| `status` | `string` | `tickets.status` |
| `severity` | `string` | `tickets.severity` |
| `description` | `string` | `tickets.description` |
| `location` | `string` | `tickets.location` |
| `created_at` | `string (ISO)` | `tickets.created_at` |
| `assignee_name` | `string` | `profiles.name`（assignee 关联） |
| `project_name` | `string` | `projects.name` |

说明：明确排除 `images`、`detail`、`root_cause`、`prevention` 等大字段。

### 4) QueryTicketOutput

| 字段 | 类型 | 说明 |
|------|------|------|
| `items` | `TicketSummaryItem[]` | 按 `created_at desc` 返回，最多 `limit` 条 |
| `truncated` | `boolean` | 总命中数超过 `limit` 时为 `true` |
| `total` | `number` | 命中总数（用于提示是否可细化） |

---

## 关系与约束

- `QueryTicketInput` + `QueryTicketRuntimeContext` 共同驱动一次查询执行。
- `QueryTicketRuntimeContext` 决定可见数据边界；RLS 在数据库层强制拦截越权。
- `QueryTicketOutput.items` 仅由当前 session 可访问项目数据构成。

---

## 状态与错误语义

### 成功态

- 返回 `items`（可为空）和 `truncated` 标志。
- 当 `items=[]` 且 `total=0`，Agent 应输出“未找到符合条件工单”。

### 失败态

| 场景 | 输出建议 |
|------|----------|
| session 缺失 / token 不可用 | 返回受控错误 `"UNAUTHENTICATED"`，Agent 提示重新登录 |
| Supabase 查询失败 | 返回受控错误 `"QUERY_FAILED"`，Agent 给出通用失败提示 |

---

## 兼容性说明

- `knowledge_query` 与 `create_ticket` 工具及其消息格式保持不变。
- `thread_id`、消息持久化、6 轮裁剪逻辑保持不变。
