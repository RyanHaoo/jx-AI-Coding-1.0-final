# Tasks: 工单组件与状态更改动作

**Input**: Design documents from `/specs/004-ticket-component-actions/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/api.md

**Tests**: MVP 阶段不写测试，类型检查 + lint 通过即可。

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: 安装新增依赖组件

- [x] T001 Install shadcn/ui Badge and Select components via `npx shadcn@latest add badge select`
- [x] T002 [P] Create ProjectChip component in `components/project-chip.tsx` — accepts `name` and `clientName` props, renders `name（clientName）` format

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 数据库表 + 种子数据 + 数据访问层 — MUST complete before ANY user story

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T003 Create Supabase migration: add `ticket_status`, `severity`, `specialty_type` ENUM types + `tickets` table + RLS policies in `supabase/migrations/00001_create_tickets_table.sql`
- [x] T004 Apply migration via Supabase MCP `apply_migration` tool（via MCP，代码仓库不可直接验证）
- [x] T005 Add ticket seed data (5 tickets covering pending/completed/rejected states, referencing existing profiles and projects) via Supabase MCP `execute_sql` tool（via MCP，代码仓库不可直接验证）
- [x] T006 Create ticket data access helpers in `lib/tickets.ts` — `getTicketById`, `getTicketsByProject`, `createTicket`, `updateTicket`, `updateTicketStatus` functions using Supabase server client

**Checkpoint**: Foundation ready — `tickets` table exists with seed data, data access helpers available

---

## Phase 3: User Story 1 - 查看工单详情 (Priority: P1) 🎯 MVP

**Goal**: 用户能查看工单的全部信息，按三组分区展示，状态以 Badge 标签显示

**Independent Test**: 访问 `/mobile/tickets/1`，验证所有字段正确展示、状态 Badge 正确渲染、用户/项目小组件正确嵌入

### Implementation for User Story 1

- [x] T007 [US1] Create GET ticket detail API endpoint in `app/api/tickets/[id]/route.ts` — fetch ticket with joined creator/assignee/project data, return 404 if not found
- [x] T008 [US1] Implement ticket detail component view mode in `components/ticket-detail.tsx` — three sections (基础信息 / 工单详情 / 工单复盘), status Badge, UserAvatarChip for creator/assignee, ProjectChip for project, image display, mode prop to toggle view/edit
- [x] T009 [US1] Update ticket detail page in `app/mobile/tickets/[id]/page.tsx` — Server Component: fetch ticket data via `getTicketById` + get user identity from cookie, pass to `<TicketDetail>` client component

**Checkpoint**: 访问 `/mobile/tickets/1` 可看到完整工单详情，所有字段正确展示

---

## Phase 4: User Story 2 - 编辑工单 (Priority: P2)

**Goal**: 发起人或当前责任人可切换到编辑模式，修改可读写字段后保存

**Independent Test**: 以发起人身份打开工单，点击编辑，修改字段后保存，验证数据更新到数据库

### Implementation for User Story 2

- [x] T010 [US2] Implement ticket detail component edit mode in `components/ticket-detail.tsx` — add edit mode with form inputs for severity (Select), specialty_type (Select), description (Input), location (Input), images (placeholder), detail (textarea); readonly for base info and review sections; Save button to switch back to view mode
- [x] T011 [US2] Create PATCH ticket update API endpoint in `app/api/tickets/[id]/route.ts` — validate user is creator or assignee, update editable fields, return updated ticket

**Checkpoint**: 编辑工单后保存，数据持久化到数据库，页面刷新后显示更新内容

---

## Phase 5: User Story 3 - 解决工单 (Priority: P3)

**Goal**: 当前责任人点击「解决」按钮，工单状态直接变为「已完成」

**Independent Test**: 以施工方身份打开待处理工单，点击解决，验证状态变为已完成

### Implementation for User Story 3

- [x] T012 [US3] Create POST resolve action API endpoint in `app/api/tickets/[id]/actions/resolve/route.ts` — validate user is assignee or admin, validate status is pending, update status to completed
- [x] T013 [US3] Implement TicketActions component in `components/ticket-actions.tsx` — render action buttons based on user identity + ticket status per FR-011~FR-016; disable buttons during API call; call fetch on click then `router.refresh()`
- [x] T014 [US3] Integrate TicketActions into TicketDetail component in `components/ticket-detail.tsx` — render `<TicketActions>` in view mode bottom area, pass ticket data + user identity as props

**Checkpoint**: 解决按钮按权限显示，点击后状态变为已完成，页面刷新后数据正确

---

## Phase 6: User Story 4 - 拒绝工单 (Priority: P4)

**Goal**: 当前责任人点击「拒绝」按钮，工单状态直接变为「已拒绝」

**Independent Test**: 以施工方身份打开待处理工单，点击拒绝，验证状态变为已拒绝

### Implementation for User Story 4

- [x] T015 [US4] Create POST reject action API endpoint in `app/api/tickets/[id]/actions/reject/route.ts` — validate user is assignee or admin, validate status is pending, update status to rejected
- [x] T016 [US4] Add reject button handler in `components/ticket-actions.tsx` — call `/api/tickets/[id]/actions/reject`, disable during call, refresh on success

**Checkpoint**: 拒绝按钮按权限显示，点击后状态变为已拒绝

---

## Phase 7: User Story 5 - 重新打开工单 (Priority: P5)

**Goal**: 发起人点击「重新打开」按钮，已关闭工单状态变回「待处理」

**Independent Test**: 以发起人身份打开已完成/已拒绝工单，点击重新打开，验证状态变回待处理

### Implementation for User Story 5

- [x] T017 [US5] Create POST reopen action API endpoint in `app/api/tickets/[id]/actions/reopen/route.ts` — validate user is creator or admin, validate status is completed or rejected, update status to pending, keep assignee unchanged
- [x] T018 [US5] Add reopen button handler in `components/ticket-actions.tsx` — call `/api/tickets/[id]/actions/reopen`, disable during call, refresh on success

**Checkpoint**: 重新打开按钮按权限显示，点击后状态变回待处理，责任人不变

---

## Phase 8: User Story 1 补充 - GET 工单列表 API (Priority: P1)

**Goal**: 为后续工单列表页和 Agent 模块提供列表查询能力

**Independent Test**: GET `/api/tickets?projectId=1` 返回该项目下的工单列表

### Implementation

- [x] T019 [US1] Create GET ticket list API endpoint in `app/api/tickets/route.ts` — fetch tickets by projectId with joined creator/assignee data, support query param `projectId`
- [x] T020 [US1] Create POST create ticket API endpoint in `app/api/tickets/route.ts` — validate user is 质检员, insert ticket with defaults, return created ticket

**Checkpoint**: 列表和创建 API 可用，为阶段 4（工单列表页）和阶段 5（Agent 模块）提供支撑

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: 类型检查、lint 修复、格式化

- [x] T021 Run `npm run format` + `npm run lint` + `npx tsc --noEmit` to ensure all checks pass
- [x] T022 Fix any type errors or lint issues found in T021

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **User Stories (Phase 3-7)**: All depend on Foundational phase completion
  - US1 (查看) → US2 (编辑) → US3 (解决) → US4 (拒绝) → US5 (重新打开)
  - US3 depends on US1 (needs TicketDetail component) and US1 (needs page)
  - US4 and US5 depend on US3 (needs TicketActions component)
- **API 补充 (Phase 8)**: Depends on Foundational, independent of US2-US5
- **Polish (Phase 9)**: Depends on all desired user stories being complete

### User Story Dependencies

- **US1 (查看工单详情)**: After Foundational — No dependencies on other stories
- **US2 (编辑工单)**: After US1 — Extends TicketDetail component with edit mode
- **US3 (解决工单)**: After US1 — Adds TicketActions component + resolve endpoint
- **US4 (拒绝工单)**: After US3 — Adds reject button to TicketActions + reject endpoint
- **US5 (重新打开工单)**: After US3 — Adds reopen button to TicketActions + reopen endpoint

### Within Each User Story

- API endpoints before UI integration
- Components before pages
- Core implementation before error handling

### Parallel Opportunities

- T001 + T002 can run in parallel (different files)
- T003-T005 sequential (migration → apply → seed)
- T007 + T008 can run in parallel after T006 (API vs component, different files)
- T010 + T011 can run in parallel after US1 checkpoint (edit component vs PATCH API)
- T012 can start in parallel with T013 after US1 checkpoint (API vs component)
- T015 + T017 can run in parallel (different API files)
- T019 + T020 can run in parallel (GET vs POST in same file but different handlers)

---

## Parallel Example: User Story 1

```bash
# After T006 completes, launch these in parallel:
Task: "Create GET ticket detail API in app/api/tickets/[id]/route.ts"
Task: "Implement ticket detail component view mode in components/ticket-detail.tsx"
```

## Parallel Example: User Story 3

```bash
# After US1 checkpoint, launch these in parallel:
Task: "Create POST resolve action API in app/api/tickets/[id]/actions/resolve/route.ts"
Task: "Implement TicketActions component in components/ticket-actions.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T002)
2. Complete Phase 2: Foundational (T003-T006)
3. Complete Phase 3: User Story 1 (T007-T009)
4. **STOP and VALIDATE**: 访问 `/mobile/tickets/1` 验证工单详情展示
5. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → 数据库就绪
2. Add US1 → 工单详情展示 (MVP!)
3. Add US2 → 工单编辑功能
4. Add US3 → 解决工单功能
5. Add US4 → 拒绝工单功能
6. Add US5 → 重新打开功能
7. Add Phase 8 → 列表/创建 API
8. Each story adds value without breaking previous stories

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- MVP 阶段不写测试，类型检查 + lint 通过即可
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- 避免跨 story 的耦合依赖