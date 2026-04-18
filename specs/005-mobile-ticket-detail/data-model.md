# Phase 1 Data Model: 移动端工单界面

**Feature**: 005-mobile-ticket-detail  
**Date**: 2026-04-18  
**Status**: Complete — 本 spec 不新增/修改数据库 schema。本文件仅记录本功能依赖的既有实体与查询形状，便于追溯。

---

## 数据源总览

本功能**完全不新增**任何数据库表、列或关系；所有数据来自 002/004 已建表：

- `profiles`（用户业务资料）
- `projects`（项目）
- `user_roles`（用户 × 项目 × 角色三元组）
- `tickets`（工单）

---

## 消费的实体（只读视图 + 通过 API 的写入）

### Ticket（来自 `lib/tickets.ts#TicketWithRelations`）

列表页与详情页都消费此形状；本 spec 不修改它。

| 字段 | 类型 | 列表页使用 | 详情页使用 |
|------|------|-----------|-----------|
| `id` | number | 工单编号 `#ID` | 基础信息 |
| `status` | `"待处理" \| "已完成" \| "已拒绝"` | 状态 Badge + Tab 过滤依据 | 基础信息 Badge + 按钮可见性 |
| `severity` | `"轻微" \| "一般" \| "严重" \| "紧急"` | 严重 Badge + **紧急置顶**与红框高亮 | 展示 / 编辑 |
| `created_at` | ISO string | 格式化展示 + 排序主键 | 基础信息 |
| `creator` | `{id, name, department, avatar_url}` | — | 发起人 `UserAvatarChip` |
| `project` | `{id, name, client_name}` | — | 所在项目 `ProjectChip` |
| `assignee` | `{id, name, department, avatar_url}` | 责任人 `UserAvatarChip` | 责任人 `UserAvatarChip` |
| `description` | string | 截断前 20 字展示 | 完整展示 / 编辑 |
| `location` | string | 小字展示 | 展示 / 编辑 |
| `images` | string[] | 首图预览（如有） | 全部展示 / 编辑占位 |
| `specialty_type` | enum | — | 展示 / 编辑 |
| `detail` | string | — | 展示 / 编辑 |
| `root_cause` | string | — | 复盘展示 |
| `prevention` | string | — | 复盘展示 |
| `knowledge_base` | boolean | — | 复盘展示 |

### Active Identity（来自 `lib/auth.ts#getIdentityFromCookie`）

本 spec 间接依赖：

- 列表页不直接读；`GET /api/tickets` 在无 `projectId` query 时自动回退到 cookie 里的 `active_project_id`（`app/api/tickets/route.ts:10–14`）。
- 详情页通过 RSC 读取 cookie 得到当前 `role`（`app/mobile/tickets/[id]/page.tsx:24–27`），传给 `TicketDetail` 用于按钮可见性。

---

## 查询形状

本 spec **不引入新查询**；调用方式如下：

| 调用方 | 端点 | 形状 |
|--------|------|------|
| 列表页客户端 | `GET /api/tickets` | 无 query 参数 → 后端以 cookie 中的 `active_project_id` 作为过滤，返回当前项目全部工单（默认 `created_at desc`） |
| 详情页 RSC | 直接调用 `lib/tickets.ts#getTicketById(id)` | 返回单条 `TicketWithRelations` 或 `null`；`null` 触发 `notFound()` |
| 编辑保存 | `PATCH /api/tickets/:id` | 由 `TicketDetail` 组件内部触发（004 已实现） |
| 状态变更 | `POST /api/tickets/:id/actions/{resolve,reject,reopen}` | 由 `TicketActions` 组件内部触发（004 已实现） |

---

## 前端内部状态（非数据库）

在 Client Component `app/mobile/tickets/page.tsx` 内维护：

| 状态 | 类型 | 初始值 | 说明 |
|------|------|--------|------|
| `tickets` | `TicketWithRelations[]` | `[]` | 当前项目全部工单（已拉取） |
| `loading` | boolean | `true` | API 请求中 |
| `error` | `string \| null` | `null` | 错误提示文本 |
| `activeTab` | `"pending" \| "closed" \| "all"` | `"pending"` | 当前选中 Tab |

派生列表（`useMemo` 计算，依赖 `tickets` 与 `activeTab`）：

```
filtered = tickets where matches(activeTab, ticket.status)
urgent   = filtered where severity === "紧急"   (保持相对顺序)
rest     = filtered where severity !== "紧急"
display  = [...urgent, ...rest]
```

---

## 状态转换

本 spec **不引入新状态机**。工单状态机完全沿用 004（详见 `doc/工单状态机.md`）。本功能仅负责：

1. 在列表页按 `status` 进行 Tab 分组展示（只读）。
2. 在详情页调用既有状态变更 API 后，通过 `router.refresh()` 触发 RSC 重渲染以反映新状态。

---

## 约束与校验

均由后端既有 API 与 RLS 承担：

- **项目范围隔离**：`GET /api/tickets` 强制按 cookie 中的 `active_project_id` 过滤；Supabase RLS 二次兜底。
- **编辑权限**：`PATCH /api/tickets/:id` 已在 004 中校验 `creator/assignee/admin` 三者之一。
- **状态机前置条件**：`actions/{resolve,reject,reopen}` 路由已在 004 中按 `doc/工单状态机.md` 实现校验。

本 spec 前端**不重复校验**（宪法 III），仅通过按钮可见性做 UX 提示。
