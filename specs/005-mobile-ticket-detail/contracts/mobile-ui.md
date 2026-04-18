# UI Contract: 移动端工单界面

**Feature**: 005-mobile-ticket-detail  
**Date**: 2026-04-18

本项目对"外部接口"的理解为：用户可见的**路由**、**跨组件 props 契约**、以及既有 **HTTP API 的消费约定**。本 spec 不新增 HTTP 端点，本文件因此聚焦前端契约。

---

## 1. 路由契约

| 路由 | 渲染模式 | 标题（顶栏） | 顶栏左侧 | 鉴权 |
|------|----------|--------------|----------|------|
| `/mobile/tickets` | Client Component（数据在 `useEffect` 拉取） | "工单列表" | 汉堡菜单 → 打开侧边抽屉 | 必须已登录且已选身份；否则 Proxy 重定向到 `/login?redirect=...` |
| `/mobile/tickets/:id` | RSC（`params` 为 Promise） | "工单详情" | 返回箭头 → `router.back()`；无历史则退回 `/mobile/tickets` | 同上；且工单必须属于当前身份所在项目（否则 `notFound()`） |

---

## 2. `MobileTopBar` 组件 props（扩展后）

```ts
interface MobileTopBarProps {
  title: string;
  onMenuClick: () => void;
  showBack?: boolean;   // 默认 false
  onBack?: () => void;  // 默认 router.back()
}
```

### 行为约定

- `showBack === false`：左侧渲染汉堡菜单图标（`Menu`），点击触发 `onMenuClick`。
- `showBack === true`：左侧渲染返回图标（`ArrowLeft`），点击触发 `onBack`；**此时不触发 `onMenuClick`，也不渲染菜单图标**。
- `title` 继续渲染在图标右侧。

### `MobileLayoutClient` 侧的决定逻辑

```
showBack = /^\/mobile\/tickets\/[^/]+$/.test(pathname)
title    =
  showBack ? "工单详情"
           : (routeTitleMap[pathname] ?? fallback)
```

---

## 3. `TicketListItem` 组件 props（新增）

```ts
interface TicketListItemProps {
  ticket: TicketWithRelations;
}
```

### 渲染契约

- **卡片外壳**：圆角 + 边框；`ticket.severity === "紧急"` 时边框为红色（例如 `border-destructive`）。
- **左侧首图**：当 `ticket.images.length > 0` 时渲染 `ticket.images[0]` 为 `next/image`（80×80、`object-cover`、圆角）；否则不渲染占位。
- **主体**：
  - 第一行：`#{ticket.id}` + 状态 Badge + 严重程度 Badge（紧急时 destructive 颜色）
  - 第二行：问题描述（`line-clamp-1` 或前 20 字 `+ …` 截断）
  - 第三行（小字）：`ticket.location`
  - 第四行（小字）：`YYYY-MM-DD HH:mm` 格式的 `created_at`
  - 第五行（右对齐）：`UserAvatarChip` 展示 `ticket.assignee`
- **交互**：整卡片包在 `<Link href={/mobile/tickets/${ticket.id}}>` 内；点击跳转。

---

## 4. 列表页 Tab 契约

| Tab 显示文案 | 内部 value | 过滤条件 |
|--------------|-----------|----------|
| 待处理 | `"pending"` | `ticket.status === "待处理"` |
| 已结束 | `"closed"` | `ticket.status === "已完成" \|\| ticket.status === "已拒绝"` |
| 全部 | `"all"` | 不过滤 |

- 默认 Tab：`"pending"`。
- Tab 切换为前端瞬时操作，不触发接口。

**紧急置顶不变规则**：任何 Tab 下，`severity === "紧急"` 的工单保持在列表最前；非紧急工单按 `created_at desc` 排序。

---

## 5. HTTP API 消费约定（沿用 004）

本 spec 仅消费既有契约，不新增端点：

### `GET /api/tickets`

- **Query**: `projectId?` —— 省略时后端从 cookie 读取 `active_project_id`。本 spec 中**省略**此参数（由 cookie 驱动）。
- **Response 200**: `{ tickets: TicketWithRelations[] }`
- **Response 400**: `{ error: "缺少有效的 projectId" }` —— 理论上只在用户未选身份时出现；本 spec 视为 Proxy 应该已提前拦截的异常，UI 显示通用错误态即可。

### `GET /api/tickets/:id`

本 spec 前端**不直接调用**；`app/mobile/tickets/[id]/page.tsx` 是 RSC，直接通过 `lib/tickets.ts#getTicketById` 读库。

### `PATCH /api/tickets/:id` / `POST /api/tickets/:id/actions/{resolve,reject,reopen}`

由 `TicketDetail`/`TicketActions` 组件内部调用（004 已实现），本 spec 不关心其形状。保存或状态变更成功后这两个组件会调用 `router.refresh()`，让详情页 RSC 重新读库 → 页面即时反映变更（对齐 FR-014）。

---

## 6. 鉴权重定向契约（沿用 002）

本 spec 不新增 middleware/proxy 逻辑。只断言如下既有行为：

- 未登录访问 `/mobile/tickets*` → `302 /login?redirect=<原路径>`
- 已登录但无活跃身份 → `302 /login?redirect=<原路径>`（选身份后回跳）

若上述行为在联调中失灵，应视为 002 的回归问题处理，不在本 spec 范围。
