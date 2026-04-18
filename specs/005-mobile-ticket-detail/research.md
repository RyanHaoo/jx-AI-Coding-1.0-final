# Phase 0 Research: 移动端工单界面

**Feature**: 005-mobile-ticket-detail  
**Date**: 2026-04-18  
**Status**: Complete — 所有 Technical Context 项已解析；无残留 NEEDS CLARIFICATION。

本阶段不存在未知技术；所有选型均由宪法、`CLAUDE.md`、既有实现和 spec Assumptions 共同约束。以下条目记录关键决策与理由。

---

## Decision 1：Tab 过滤在前端本地完成（不调用后端多次）

- **Decision**: 一次拉取当前项目的全部工单（`GET /api/tickets`），客户端用 `useMemo` 基于 Tab 值过滤。
- **Rationale**:
  - Spec Assumptions 明确 limit 50，数据量极小；再发 3 次请求是浪费。
  - 本项目种子工单 < 20 条；本地切换零延迟，满足 SC-003。
  - 符合宪法 III（最小抽象）：不需要 URL query 参数、不需要封装过滤 hook。
- **Alternatives considered**:
  - 带 `status` query 参数重新请求：增加往返延迟，与 SC-003 相背；且要改后端契约。
  - 用 RSC + `searchParams`：每次切换都整页刷新，动画与滚动位置会丢失。

## Decision 2：紧急工单置顶用纯数组排序

- **Decision**: 客户端在 `useMemo` 中先把 `severity === "紧急"` 的工单稳定提到数组前部，剩余按 `created_at desc` 排序。
- **Rationale**: 不动后端；逻辑 3 行；符合最小抽象原则。
- **Alternatives considered**:
  - 后端添加二级排序：改动面大、回报低。

## Decision 3：列表 Tab 使用 shadcn/ui `Tabs` 组件

- **Decision**: 通过 `npx shadcn@latest add tabs` 引入 shadcn `Tabs`；Tab 值采用中文枚举 `"待处理" | "已结束" | "全部"`。
- **Rationale**: 项目已统一使用 shadcn/ui；Tabs 是标准组件，Radix 背后无障碍完备；无需自研。
- **Alternatives considered**:
  - 手搓按钮组：样式需额外调试，增加视觉细节工作量。

## Decision 4：详情页顶栏返回按钮通过扩展 `MobileTopBar` 可选 props 实现

- **Decision**: `MobileTopBar` 新增可选 `showBack` 与 `onBack` props；当 `showBack=true` 时左侧渲染返回按钮（`ArrowLeft` 图标）替代汉堡菜单图标；`onBack` 默认回调 `router.back()`。路由层面由 `MobileLayoutClient` 根据 `pathname` 判断是否为 `/mobile/tickets/[id]` 并启用 `showBack`。
- **Rationale**:
  - 保留单一顶栏组件，与现有通用布局一致；无需为详情页另造一套顶栏。
  - `onBack` 采用 `router.back()`；若用户是通过外链直入详情页，`router.back()` 无历史时回退到列表页（Next.js 默认行为即可接受，宪法 I：不做边界防御）。
- **Alternatives considered**:
  - 在详情页内嵌独立顶栏：破坏共享布局；侧边目录也需要重新接入，成本高。
  - 用 Next.js `<Link href="/mobile/tickets">` 代替 `router.back()`：会丢失"返回前页状态"的语义，用户预期不符。

## Decision 5：未登录/身份未选择的鉴权守卫复用既有 Proxy

- **Decision**: 鉴权重定向行为由根 `proxy.ts` 处理（已在 002 中完成），本 spec 不新增 middleware/proxy 逻辑。
- **Rationale**: 该能力属于跨路由横切关注点；既有 Proxy 已覆盖 `/mobile/*`，再加一层只会重复。
- **Alternatives considered**:
  - 在 `app/mobile/layout.tsx` 内做服务端 redirect：与 Proxy 重复、职责混乱。

## Decision 6：加载态用 `loading.tsx`；错误态内联显示

- **Decision**:
  - 列表页：`app/mobile/tickets/loading.tsx` 提供骨架屏（Next.js App Router 约定）。
  - 详情页：`app/mobile/tickets/[id]/loading.tsx` 提供骨架屏。
  - 接口错误：在客户端组件或 RSC 返回错误块（红字 + 重试按钮或返回链接）。
- **Rationale**: App Router 的 `loading.tsx` 是最小成本方案；错误块一处使用不抽 `ErrorState` 组件（宪法 III）。
- **Alternatives considered**:
  - 客户端 `useEffect` + 手动 `loading` state：列表页已是这种形态，改为 RSC + `loading.tsx` 更简洁，但 Tab 过滤又需要 Client Component。折衷方案：列表页保持客户端获取数据（已有），`loading.tsx` 仅用于导航进入页面的短暂过渡。

## Decision 7：列表项卡片 `ticket-list-item.tsx` 作为单独文件

- **Decision**: 新增 `components/ticket-list-item.tsx`；位于项目顶级 `components/` 下（与既有 `project-chip.tsx`、`user-avatar-chip.tsx` 风格一致）。
- **Rationale**: 虽然仅在一处使用，但该组件含 8+ 个字段、图片预览、Badge、条件高亮边框；内联到 `page.tsx` 会使后者超过 150 行，阅读成本高于抽取。符合宪法 III 的 "3 处以上再抽取" 例外：**单次使用但组件本身复杂度高**。
- **Alternatives considered**:
  - 全部内联在 `page.tsx`：降低可读性；调试紧急置顶与 Tab 切换逻辑时易混淆。

## Decision 8：无权/404 处理

- **Decision**:
  - 详情页 RSC 已用 `notFound()` 触发默认 404；保留该行为。
  - 由于 RLS 已限制读取范围（仅当前项目工单可读），非法访问在 `getTicketById` 处返回 `null`，自然走 404。
  - 本 spec 不新增 `not-found.tsx` 定制页面（Next.js 默认足够 for MVP）。
- **Rationale**: 宪法 I（MVP 优先）。
- **Alternatives considered**:
  - 自定义 `not-found.tsx` + "返回列表" 按钮：spec FR-012 要求有返回入口。**采纳**最小版本：新增 `app/mobile/tickets/[id]/not-found.tsx`，仅一段文字 + 一个 `<Link href="/mobile/tickets">`。

## Decision 9：不改动任何后端 API 契约

- **Decision**: `GET /api/tickets`、`GET /api/tickets/:id`、`PATCH /api/tickets/:id` 的入出参完全沿用 004；本 spec 不新增也不修改后端路由。
- **Rationale**: 契约已满足 spec 全部 FR；改动只会增加回归风险。

---

## Outstanding NEEDS CLARIFICATION

无。

## 关键引用

- `.specify/memory/constitution.md` — 开发原则与技术栈
- `CLAUDE.md` — 项目结构与 Next.js 16 变更
- `doc/移动端/工单列表页.md` — 列表页字段、Tab、紧急置顶规格
- `doc/移动端/工单详情页.md` — 详情页顶栏返回与页面结构
- `doc/移动端/通用布局.md` — 顶栏与侧边抽屉定义
- `specs/004-ticket-component-actions/spec.md` — 工单详情组件与 API 契约
