# Tasks: 移动端工单界面（列表 + 详情组件接入）

**Input**: Design documents from `/specs/005-mobile-ticket-detail/`  
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/mobile-ui.md, quickstart.md

**Tests**: 按宪法 I（MVP 优先）与 spec 要求，**不生成测试任务**；仅在 Polish 阶段运行 `tsc --noEmit` + `biome`。

**Organization**: 按 spec.md 中的 5 个用户故事（P1–P5）分组。每个故事独立可验收。

---

## Path Conventions

Next.js 16 App Router 单一代码库。源代码根为仓库根目录：

- 页面：`app/mobile/tickets/**`
- 共享组件：`components/**`
- UI 原子：`components/ui/**`
- 后端与数据层：**本 spec 不改动**

---

## Phase 1: Setup

**Purpose**: 引入本 spec 需要的新 UI 原子，新建空的组件文件占位。

- [X] T001 运行 `npx shadcn@latest add tabs` 在 `components/ui/tabs.tsx` 生成 shadcn `Tabs`/`TabsList`/`TabsTrigger`/`TabsContent` 原子（若已存在则跳过）
- [X] T002 [P] 新建空文件 `components/ticket-list-item.tsx`，导出一个占位函数组件 `TicketListItem` 接收 `{ ticket }` prop 并 `return null`（便于后续并行开发引用）

**Checkpoint**: 工具原子就位，可进入 Foundational 阶段。

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 顶栏返回按钮能力是 US1（详情页）与 US2（列表→详情→返回）共同依赖的核心基础设施，必须先完成。

- [X] T003 扩展 `components/mobile-top-bar.tsx`：在 `MobileTopBarProps` 新增可选 `showBack?: boolean`（默认 `false`）与 `onBack?: () => void`；当 `showBack === true` 时左侧渲染 `lucide-react` 的 `ArrowLeft` 按钮并触发 `onBack`，否则渲染原有 `Menu` 按钮触发 `onMenuClick`
- [X] T004 更新 `components/mobile-layout-client.tsx`：用 `next/navigation` 的 `useRouter` 获取 `router`；基于 `pathname` 正则 `/^\/mobile\/tickets\/[^/]+$/` 判断是否详情路由；详情路由下把 `title` 固定为"工单详情"，并把 `showBack={true}` 与 `onBack={() => router.back()}` 传给 `MobileTopBar`；其他路由保持原 `routeTitleMap` 行为

**Checkpoint**: 通用布局完备，任何子页面都能获得一致的返回体验。后续 US1–US5 可以并行。

---

## Phase 3: User Story 1 — 打开移动端工单详情页查看工单 (Priority: P1) 🎯 MVP

**Goal**: 用户可进入 `/mobile/tickets/:id`，在工单详情组件中看到完整信息，并通过顶栏返回按钮回到列表页。

**Independent Test**: 以任意种子工单访问 `/mobile/tickets/<id>`，详情组件正确渲染，顶栏显示"工单详情"和返回箭头；点击返回能回到 `/mobile/tickets`。对应 quickstart 场景 3。

### Implementation for User Story 1

- [X] T005 [US1] 确认 `app/mobile/tickets/[id]/page.tsx` 保持当前 RSC 实现（`await params`、`getTicketById`、`notFound()`、传 `userIdentity` 给 `TicketDetail`）；无需代码改动，仅在本次编辑中回读文件核对字段与权限逻辑是否与 004 对齐
- [X] T006 [P] [US1] 新建 `app/mobile/tickets/[id]/loading.tsx`：导出默认函数返回简单骨架屏（几个 `div` + `animate-pulse`，复用基础信息/详情/复盘三段大致的高度即可；不抽组件）
- [X] T007 [P] [US1] 新建 `app/mobile/tickets/[id]/not-found.tsx`：导出默认函数，渲染"工单不存在或无权访问"提示 + `next/link` 指向 `/mobile/tickets` 的"返回工单列表"按钮（使用 `components/ui/button`）

**Checkpoint**: 独立可验收 — US1 完整工作。

---

## Phase 4: User Story 2 — 列表页按状态筛选工单 (Priority: P2)

**Goal**: `/mobile/tickets` 以完整卡片展示当前项目工单，支持"待处理 / 已结束 / 全部"三 Tab 切换和紧急置顶，点击卡片进入详情。

**Independent Test**: 见 quickstart 场景 2。切换 Tab 过滤结果正确，紧急工单始终置顶并带红色边框，点击卡片跳转到详情页。

### Implementation for User Story 2

- [X] T008 [US2] 实现 `components/ticket-list-item.tsx`：
  - props：`{ ticket: TicketWithRelations }`
  - 整卡片外层用 `next/link` 的 `Link` 指向 `/mobile/tickets/${ticket.id}`
  - 卡片外壳：圆角 + 边框；`ticket.severity === "紧急"` 时边框改为 `border-destructive`
  - 当 `ticket.images.length > 0` 时左侧渲染 `next/image` 展示 `ticket.images[0]`（80×80、`object-cover`、圆角）
  - 主区域：第一行 `#{ticket.id}` + 状态 `Badge`（沿用 `components/ticket-detail.tsx` 中的 `statusVariantMap` 风格，紧急 severity 用 `destructive` Badge）+ 严重程度 Badge；第二行问题描述（`line-clamp-1`）；第三行详细位置小字；第四行 `created_at` 格式化 `YYYY-MM-DD HH:mm`（用 `toLocaleString("zh-CN")` 即可）；右下角放责任人 `UserAvatarChip`（`compact`）
  - 中文文案，英文变量命名
- [X] T009 [US2] 重写 `app/mobile/tickets/page.tsx`：
  - 保持 `"use client"`；保留既有 `fetch("/api/tickets")` 数据获取、`loading/error/tickets` 三个 state
  - 新增 `activeTab` state：`"pending" | "closed" | "all"`，默认 `"pending"`
  - 用 `shadcn` 的 `Tabs` + `TabsList` + `TabsTrigger`，三个 Tab 文案 `待处理 / 已结束 / 全部`
  - 用 `useMemo` 计算 `display = [...urgent, ...rest]`：先按 Tab 过滤（pending→`status==="待处理"`；closed→`status==="已完成" || status==="已拒绝"`；all→全部），再把 `severity==="紧急"` 的稳定提到前面；其余按 `created_at` desc
  - 列表渲染：用 `TicketListItem` 迭代 `display`
  - loading：展示"加载中..."占位（或引用加载骨架样式，最小实现即可）
  - error：展示红字 + "重试"按钮（点击重走一次请求）
  - 空态（`!loading && !error && display.length === 0`）：展示"暂无工单"占位文案
- [X] T010 [P] [US2] 新建 `app/mobile/tickets/loading.tsx`：导出默认函数返回列表骨架屏（3–5 条灰色卡片占位 + `animate-pulse`）

**Checkpoint**: US1 + US2 可独立验收。此时移动端"打开 → 浏览 → 进入详情 → 返回"主路径闭环。

---

## Phase 5: User Story 3 — 在移动端详情页完成工单状态流转 (Priority: P3)

**Goal**: 详情页中的解决 / 拒绝 / 重新打开按钮能正确变更工单状态，界面即时刷新，请求期间按钮禁用。

**Independent Test**: 见 quickstart 场景 5。

### Implementation for User Story 3

- [X] T011 [US3] 打开 `components/ticket-actions.tsx`（004 已实现），核验三点并按需微调：
  - 三个动作成功后是否调用了 `router.refresh()`（若未调用则添加，确保详情页 RSC 重取数据以满足 FR-014）
  - API 请求进行中是否有 `pending` 本地 state 并把所有按钮 `disabled={pending}`（FR-015）
  - 失败场景（非 200）不要静默；在组件内简单 `alert` 或内联文字提示即可（MVP 最小版本）
- [X] T012 [US3] 在 `components/ticket-detail.tsx` 的 `handleSave` 成功路径后确认已调用 `router.refresh()`（现状已调用，任务目的是回读确认，若缺失则补上）

**Checkpoint**: 状态流转闭环。US3 与 US1/US2 独立成立。

---

## Phase 6: User Story 4 — 在详情页编辑工单可写字段 (Priority: P4)

**Goal**: 编辑/保存/切换回展示模式的交互正确，未保存字段在切出路由时直接丢弃（MVP）。

**Independent Test**: 见 quickstart 场景 4。

### Implementation for User Story 4

- [X] T013 [US4] 核验 `components/ticket-detail.tsx` 编辑模式覆盖了 spec 列出的 6 个可写字段：`severity`（Select）、`specialty_type`（Select）、`description`（Input）、`location`（Input）、`images`（占位文案，FR 范围内）、`detail`（textarea）；若有缺失则补齐（当前实现已覆盖，任务目的是对齐 spec 后核对）
- [X] T014 [US4] 核验保存成功回调将 `mode` 切回 `"view"` 并调用 `router.refresh()`；保存失败时保持编辑模式并给出可见错误提示（当前实现仅 `setSaving(false)`，需要在 `!res.ok` 分支增加简单错误提示，例如 `alert` 或内联 `error` 文案）

**Checkpoint**: US4 独立可验收。

---

## Phase 7: User Story 5 — 加载 / 空 / 错误 / 鉴权 (Priority: P5)

**Goal**: 列表页/详情页在各种非幸福路径下都有合理的界面反馈；未登录访问触发 Proxy 重定向。

**Independent Test**: 见 quickstart 场景 1、6、7。

### Implementation for User Story 5

- [X] T015 [P] [US5] 核验 `proxy.ts` 对 `/mobile/tickets` 与 `/mobile/tickets/:id` 的未登录重定向仍然生效（`GET /mobile/tickets*` 未登录 → `302 /login?redirect=<原路径>`）；若失效，**不在本 spec 修复**，仅在 tasks.md 中以 `NOTE` 形式记录并回归 002
- [X] T016 [P] [US5] 在 T009 的空态/错误态基础上微调：空态提供一句辅助文字（如"当前筛选下没有工单"），错误态确保"重试"按钮可用；紧急置顶与 Tab 切换不影响空态判断（此任务是最终抛光，与 T009 逻辑分工：T009 保证基本态存在，T016 保证文案/交互达标）
- [X] T017 [US5] 确认 `app/mobile/tickets/[id]/not-found.tsx`（由 T007 创建）的按钮可视、文案清晰

**Checkpoint**: 所有 5 个用户故事交付完毕。

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: 交付前的质量关卡。宪法 I 要求 MVP 只跑类型检查 + lint。

- [X] T018 运行 `npm run format` 统一格式
- [X] T019 运行 `npm run lint` 确认 Biome 零告警
- [X] T020 运行 `npx tsc --noEmit` 确认 TypeScript 零错误
- [X] T021 按 `specs/005-mobile-ticket-detail/quickstart.md` 的 7 个场景人工逐条走查；发现问题则补提 tasks 并返回对应 Phase
- [X] T022 更新 `progress.md`：在「阶段 4 移动端工单模块」下勾选"工单列表页完整版"条目（如未列出则补一行中文描述）

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 Setup**：无依赖，首先完成
- **Phase 2 Foundational**：依赖 Phase 1；阻塞所有用户故事
- **Phase 3 US1 / Phase 4 US2 / Phase 5 US3 / Phase 6 US4 / Phase 7 US5**：均依赖 Phase 2，彼此独立（见下）
- **Phase 8 Polish**：依赖所有要交付的用户故事完成

### User Story Dependencies

- **US1 (P1)**：依赖 Phase 2（顶栏返回按钮）；不依赖其他用户故事
- **US2 (P2)**：依赖 Phase 2；与 US1 独立（US2 的"点击卡片跳转"只需要路由存在，而路由在现状已存在）
- **US3 (P3)**：依赖 Phase 2 + 既有 `TicketActions` 组件；与 US1/US2 独立
- **US4 (P4)**：依赖 Phase 2 + 既有 `TicketDetail` 组件；与其他独立
- **US5 (P5)**：主要是对 US1/US2 的抛光 + 对既有 Proxy 的回归验证；可与 US3/US4 并行

### Within Each User Story

- 组件实现（T008）先于消费方（T009）——因此 T008 必须在 T009 之前
- `loading.tsx` 文件无依赖，可与页面实现并行（T010 与 T009 并行，T006 与 T005 并行）
- 回读核验类任务（T005/T011/T012/T013）若发现需要修改，按修改点与其他任务的文件冲突再排序

### Parallel Opportunities

- Phase 1 内：T001 与 T002 可并行（文件不冲突）
- Phase 2 内：T003、T004 顺序执行（T004 依赖 T003 的新 props）
- Phase 3 内：T005（核验 page.tsx）、T006（新建 loading.tsx）、T007（新建 not-found.tsx）三者文件互斥，全部并行
- Phase 4 内：T008 完成后，T009 与 T010 可并行（不同文件）
- 人员分工：Phase 2 完成后，开发者 A 做 US1+US2，开发者 B 做 US3+US4（互不影响），开发者 C 做 US5

---

## Parallel Example: User Story 1

```bash
# Phase 3 三个任务可同时进行：
Task: "回读 app/mobile/tickets/[id]/page.tsx 并对照 004 spec 核验"
Task: "新建 app/mobile/tickets/[id]/loading.tsx 骨架屏"
Task: "新建 app/mobile/tickets/[id]/not-found.tsx 404 页"
```

## Parallel Example: Polish

```bash
# Phase 8 质量关卡串行执行（T018 → T019 → T020）但独立于人工走查 T021
Task: "npm run format → npm run lint → npx tsc --noEmit 三连"
Task: "按 quickstart.md 场景 1–7 人工走查"
```

---

## Implementation Strategy

### MVP First (US1 only)

1. 完成 Phase 1 + Phase 2（4 个任务）
2. 完成 Phase 3（3 个任务）
3. **STOP and VALIDATE**：单独测试 US1（详情页可正常打开与返回）
4. 可交付 Demo

### Incremental Delivery（推荐）

1. Phase 1 + Phase 2 → 基础就绪
2. 交付 US1 + US2 → 列表与详情主路径闭环（Demo 点 1）
3. 交付 US3 → 状态流转 Demo 点 2
4. 交付 US4 → 编辑能力 Demo 点 3
5. 交付 US5 → 非幸福路径打磨
6. Phase 8 Polish → 正式收尾

### Parallel Team Strategy

- 3 人团队：A 做 Phase 2 后立即带 US1+US2 全流程；B 做 US3+US4（`ticket-actions.tsx` 与 `ticket-detail.tsx` 局部回读微调）；C 做 US5 + Polish

---

## Notes

- `[P]` 任务 = 不同文件、无未完成依赖
- 任一阶段的 `[Story]` 标签必须和 `spec.md` 的用户故事编号对应
- 每个 checkpoint 后都可停下做独立验证
- 禁止改动后端 API、`lib/tickets.ts`、`proxy.ts`（本 spec 明确声明零改动）；若执行中发现必须改，先回写到 `plan.md` 的 Complexity Tracking 并重走 Constitution Check
- 提交策略：每个逻辑任务完成后一次提交（宪法 IV 工作流规则）
