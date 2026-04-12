# Tasks: 项目初始化

**Input**: Design documents from `/specs/001-project-init/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: MVP 阶段不写测试，类型检查 + lint 通过即可。

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: 全局类型定义和 shadcn/ui 组件安装，所有后续任务依赖此阶段

- [x] T001 定义全局类型（Role, ProjectType, TicketStatus, Severity, SpecialtyType, TicketAction 枚举及 Profile, Project, UserRole, Ticket, TicketLog 接口）在 `lib/types.ts`
- [x] T002 [P] 安装 shadcn/ui Sheet 组件（用于移动端侧边抽屉）运行 `npx shadcn@latest add sheet`
- [x] T003 [P] 安装 shadcn/ui Input 组件（用于登录页输入框）运行 `npx shadcn@latest add input`
- [x] T004 [P] 安装 shadcn/ui Label 组件（用于登录页标签）运行 `npx shadcn@latest add label`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 根布局更新和双端共享布局组件，所有用户故事依赖此阶段

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T005 更新根布局 `app/layout.tsx`：修改 metadata（title: "建筑施工质检情报员"）、lang 改为 "zh-CN"、移除 Geist Mono 字体、确保 body 使用 `min-h-full flex flex-col`
- [x] T006 [P] 创建移动端顶栏组件 `components/mobile-top-bar.tsx`：左侧汉堡菜单按钮 + 中间页面标题（从 children 或 prop 传入），点击汉堡按钮触发侧边目录打开
- [x] T007 [P] 创建移动端侧边目录组件 `components/mobile-side-drawer.tsx`：使用 Sheet 组件从左侧滑入，包含应用标题"建筑施工质检情报员"、菜单项（智能助手→/mobile/assistant、工单列表→/mobile/tickets）、底部用户区域占位，点击菜单项后关闭抽屉并跳转
- [x] T008 创建移动端共享布局 `app/mobile/layout.tsx`：集成 MobileTopBar + MobileSideDrawer，包裹 children 作为页面内容区
- [x] T009 [P] 创建 PC 端顶栏组件 `components/dashboard-top-bar.tsx`：左侧应用标题"建筑施工质检情报员"、右侧用户区域占位（头像+姓名）
- [x] T010 [P] 创建 PC 端侧边导航组件 `components/dashboard-side-nav.tsx`：竖向导航菜单，包含数据大盘（/dashboard/overview）、工单中心（/dashboard/tickets）、知识运营（/dashboard/knowledge）三个菜单项，当前页面对应菜单项高亮
- [x] T011 创建 PC 端共享布局 `app/dashboard/layout.tsx`：集成 DashboardTopBar + DashboardSideNav，左侧导航 + 右侧内容区布局

**Checkpoint**: 布局框架就绪，移动端和 PC 端子页面可以开始实现

---

## Phase 3: User Story 1 - 首页双端入口导航 (Priority: P1) 🎯 MVP

**Goal**: 用户访问首页看到"移动端"和"PC 管理端"两个入口按钮，点击跳转到对应端

**Independent Test**: 访问 `/` 看到两个按钮，点击后分别跳转到 `/mobile/assistant` 和 `/dashboard/overview`

### Implementation for User Story 1

- [x] T012 [US1] 重写首页 `app/page.tsx`：居中布局，标题"建筑施工质检情报员"，两个大按钮——"移动端"（Smartphone 图标，链接到 /mobile/assistant）和"PC 管理端"（Monitor 图标，链接到 /dashboard/overview），白底浅蓝 Notion 风格，移动端竖排 PC 端横排

**Checkpoint**: 首页双端入口可用，可独立测试

---

## Phase 4: User Story 2 - 登录页面基础搭建 (Priority: P2)

**Goal**: 提供登录页 UI 壳，包含工号/密码输入框和登录按钮，支持 redirect 回跳

**Independent Test**: 访问 `/login` 看到表单，访问 `/login?redirect=/mobile/tickets` 能正确读取参数

### Implementation for User Story 2

- [x] T013 [US2] 创建登录页 `app/login/page.tsx`：居中卡片布局，标题"登录"，工号输入框（label: "工号"）+ 密码输入框（label: "密码"，type: password）+ 登录按钮（Button 组件），从 URL searchParams 读取 redirect 参数，登录按钮点击时校验 redirect 参数（以 `/` 开头且不含 `//`），校验通过跳转到 redirect（默认 /mobile/assistant），本阶段不做实际认证仅模拟跳转逻辑

**Checkpoint**: 登录页 UI 壳可用，redirect 逻辑正确

---

## Phase 5: User Story 3 - 路由结构与占位页面 (Priority: P3)

**Goal**: 所有规划路由可达，每个路由有占位页面，布局框架正确

**Independent Test**: 逐一访问 7 个路由，均正常渲染且布局正确

### Implementation for User Story 3

- [x] T014 [P] [US3] 创建移动端智能助手占位页 `app/mobile/assistant/page.tsx`：显示页面标题"智能助手"
- [x] T015 [P] [US3] 创建移动端工单列表占位页 `app/mobile/tickets/page.tsx`：显示页面标题"工单列表"
- [x] T016 [P] [US3] 创建移动端工单详情占位页 `app/mobile/tickets/[id]/page.tsx`：显示页面标题"工单详情"和动态 id 参数
- [x] T017 [P] [US3] 创建 PC 端数据大盘占位页 `app/dashboard/overview/page.tsx`：显示页面标题"数据大盘"
- [x] T018 [P] [US3] 创建 PC 端工单中心占位页 `app/dashboard/tickets/page.tsx`：显示页面标题"工单中心"
- [x] T019 [P] [US3] 创建 PC 端知识运营占位页 `app/dashboard/knowledge/page.tsx`：显示页面标题"知识运营"

**Checkpoint**: 所有路由可达，占位页面正确渲染

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: 验证整体集成和构建通过

- [x] T020 运行 `npx tsc --noEmit` 确认 TypeScript 类型检查通过
- [x] T021 运行 `npm run lint` 确认 Biome 检查通过
- [x] T022 运行 `npm run build` 确认生产构建无错误
- [x] T023 逐一验证 quickstart.md 中的验证清单项

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup (Phase 1) completion - BLOCKS all user stories
- **User Stories (Phase 3-5)**: All depend on Foundational (Phase 2) completion
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Depends on Phase 2 - No dependencies on other stories
- **User Story 2 (P2)**: Depends on Phase 1 (needs Input/Label components) - No dependencies on other stories
- **User Story 3 (P3)**: Depends on Phase 2 (needs layouts) - No dependencies on other stories

### Within Each User Story

- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- T002, T003, T004 (shadcn/ui 组件安装) 可并行
- T006, T007 (移动端组件) 可并行
- T009, T010 (PC 端组件) 可并行
- T014-T019 (所有占位页面) 可全部并行
- T020, T021 (类型检查和 lint) 可并行

---

## Parallel Example: User Story 3

```bash
# Launch all placeholder pages together:
Task: "创建移动端智能助手占位页 app/mobile/assistant/page.tsx"
Task: "创建移动端工单列表占位页 app/mobile/tickets/page.tsx"
Task: "创建移动端工单详情占位页 app/mobile/tickets/[id]/page.tsx"
Task: "创建 PC 端数据大盘占位页 app/dashboard/overview/page.tsx"
Task: "创建 PC 端工单中心占位页 app/dashboard/tickets/page.tsx"
Task: "创建 PC 端知识运营占位页 app/dashboard/knowledge/page.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1 (首页双端入口)
4. **STOP and VALIDATE**: 访问 `/` 确认双端入口可用
5. 可部署/demo

### Incremental Delivery

1. Complete Setup + Foundational → 布局框架就绪
2. Add User Story 1 → 测试首页入口 → MVP 就绪
3. Add User Story 2 → 测试登录页 → 功能增强
4. Add User Story 3 → 测试全部路由 → 阶段一完成
5. Polish → 构建验证通过 → 可部署

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- 本阶段不做 Supabase 对接，不做鉴权守卫
- 登录页仅 UI 壳，不做实际认证
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
