# Tasks: 重构移动端与PC端通用页面框架

**Input**: Design documents from `/specs/003-stitch-layout-refactor/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, quickstart.md

**Tests**: MVP 阶段不包含测试任务，以类型检查 + lint 通过为验证标准。

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `app/`, `components/`, `lib/` at repository root
- CSS variables in `app/globals.css`
- Layout files in `app/dashboard/layout.tsx` and `app/mobile/layout.tsx`
- Components in `components/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: 添加 Stitch 设计系统 CSS 变量，为所有框架组件提供色彩 token 基础

- [x] T001 在 `app/globals.css` 的 `:root` 中添加 `--stitch-*` 系列 CSS 变量（primary, primary-container, on-primary-container, on-surface-variant, background, surface, surface-container-low, surface-container, surface-container-lowest, surface-container-high, outline-variant）

**Checkpoint**: CSS 变量就绪，所有框架组件可直接引用

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 无额外阻塞性基础设施。Phase 1 的 CSS 变量是唯一的共享依赖，完成后即可进入用户故事实现。

**⚠️ CRITICAL**: Phase 1 完成后，所有用户故事可以并行开始

---

## Phase 3: User Story 1 - PC端管理员使用侧边栏导航各功能模块 (Priority: P1) 🎯 MVP

**Goal**: PC端侧边栏（品牌区+导航列表+高亮）和顶栏（面包屑+用户信息）框架完整实现，三个PC端页面可正确导航

**Independent Test**: 打开 /dashboard/overview，验证侧边栏品牌区、导航项高亮、顶栏面包屑和用户信息；点击各导航项可跳转并正确高亮

### Implementation for User Story 1

- [x] T002 [US1] 重写 `components/dashboard-side-nav.tsx`：品牌区（Construction 图标+"施工质检情报员"标题）+ 3 个导航项（LayoutDashboard/数据概览, ClipboardList/工单中心, BookOpen/知识运营），当前项高亮（primary-container 背景+on-primary-container 文字），非当前项 on-surface-variant 文字，侧边栏背景 surface-container-low，品牌区底部极淡 outline-variant 分隔线
- [x] T003 [US1] 重写 `components/dashboard-top-bar.tsx`：高度 h-16，面包屑导航（"首页 / 当前页名"，首页链接指向 /dashboard/overview），右侧用户头像占位+姓名占位，顶栏背景 surface-container-lowest
- [x] T004 [US1] 修改 `app/dashboard/layout.tsx`：使用新侧边栏和顶栏组件，侧边栏 w-64 固定左侧，主内容区使用 surface-container 背景+ p-6 内边距，侧边栏与主内容区间极淡 outline-variant 分隔线（非粗实线），路由到面包屑名称映射表内联在 layout 中

**Checkpoint**: PC端侧边栏导航和顶栏面包屑在三个页面中一致显示，导航项点击可跳转并高亮

---

## Phase 4: User Story 2 - 移动端用户使用侧边抽屉导航 (Priority: P2)

**Goal**: 移动端顶栏（菜单按钮+动态标题）和侧边抽屉（动态标题+副标题+导航+用户信息）框架完整实现

**Independent Test**: 打开 /mobile/assistant，验证顶栏菜单按钮和标题；点击菜单展开抽屉，抽屉显示动态标题和导航；点击导航项可跳转

### Implementation for User Story 2

- [x] T005 [US2] 重写 `components/mobile-top-bar.tsx`：菜单按钮（Menu 图标）+ 当前页面标题（通过 props 传入），顶栏背景 surface-container-lowest
- [x] T006 [US2] 重写 `components/mobile-side-drawer.tsx`：从左侧滑出 w-64 抽屉（使用 shadcn/ui Sheet），动态标题（通过 props 传入当前页面名称），固定副标题"建筑施工质检情报员"，2 个导航项（MessageSquare/智能助手, ClipboardList/工单列表），当前项高亮样式与PC端一致，底部用户信息区（头像占位+姓名+角色），导航区与用户区间极淡 outline-variant 分隔线
- [x] T007 [US2] 修改 `app/mobile/layout.tsx`：定义路由到标题映射表（/mobile/assistant → "智能助手"，/mobile/tickets → "工单列表"），通过 usePathname() 查找映射传递给 MobileTopBar 和 MobileSideDrawer，主内容区背景 surface-container-lowest + p-4 内边距

**Checkpoint**: 移动端顶栏和抽屉导航在两个页面中正确显示，抽屉打开/关闭正常，导航项点击可跳转并高亮

---

## Phase 5: User Story 3 - 页面框架视觉风格符合 Stitch 设计系统 (Priority: P3)

**Goal**: 确保所有区域分隔使用色调偏移而非粗实线边框，所有图标使用 lucide-react，视觉风格与 Stitch 设计一致

**Independent Test**: 对照 quickstart.md 验证清单逐项检查

### Implementation for User Story 3

- [x] T008 [US3] 审查所有框架组件，确认无粗实线边框分割大区域（border-border 应替换为极淡 outline-variant 分隔），确认所有图标均来自 lucide-react，确认背景色和色彩 token 与 Stitch 设计系统一致

**Checkpoint**: 无粗实线边框，所有图标为 lucide-react，色彩 token 与 Stitch 设计一致

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: 最终验证和代码质量检查

- [x] T009 运行 `npm run lint` 确认 Biome 检查通过
- [x] T010 运行 `npx tsc --noEmit` 确认 TypeScript 类型检查通过
- [x] T011 按 quickstart.md 验证清单逐项验证 PC 端和移动端页面

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: 无额外任务，Phase 1 CSS 变量完成后即可进入用户故事
- **User Stories (Phase 3-5)**: 依赖 Phase 1 CSS 变量
  - US1 和 US2 可以并行实现（不同文件，无交叉依赖）
  - US3 依赖 US1 和 US2 完成后才能做整体视觉审查
- **Polish (Phase 6)**: 依赖所有用户故事完成

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Phase 1 - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Phase 1 - No dependencies on other stories, can parallel with US1
- **User Story 3 (P3)**: Depends on US1 + US2 completion (visual review of completed components)

### Within Each User Story

- T002 → T003 → T004 (US1: 侧边栏 → 顶栏 → layout 集成)
- T005 → T006 → T007 (US2: 顶栏 → 抽屉 → layout 集成)

### Parallel Opportunities

- T002 和 T005 可以并行（不同文件）
- T003 和 T006 可以并行（不同文件）
- US1 完成后，US2 的全部任务可以独立并行

---

## Parallel Example: User Story 1 & 2

```bash
# Phase 1 完成后，可以并行启动 US1 和 US2：
Task: "T002 [US1] Rewrite dashboard-side-nav.tsx"
Task: "T005 [US2] Rewrite mobile-top-bar.tsx"

# 然后并行：
Task: "T003 [US1] Rewrite dashboard-top-bar.tsx"
Task: "T006 [US2] Rewrite mobile-side-drawer.tsx"

# 最后依次集成：
Task: "T004 [US1] Modify dashboard/layout.tsx"
Task: "T007 [US2] Modify mobile/layout.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: CSS 变量 Setup
2. Complete Phase 3: User Story 1 (PC 端框架)
3. **STOP and VALIDATE**: 在三个 PC 端页面验证侧边栏和顶栏
4. 验证通过后可先提交 MVP

### Incremental Delivery

1. Phase 1 CSS 变量 → Setup ready
2. US1 PC 端框架 → 独立验证 → 提交（MVP!）
3. US2 移动端框架 → 独立验证 → 提交
4. US3 视觉风格审查 → 最终确认 → 提交
5. Polish 阶段 → lint + tsc 通过 → 完成

### Parallel Team Strategy

单一开发者建议顺序：Phase 1 → US1 → US2 → US3 → Polish

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence