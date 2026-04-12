# Tasks: 登录与身份系统 — 数据层

**Input**: Design documents from `/specs/002-auth-identity-system/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md

**Tests**: MVP 阶段不写测试，通过 tsc --noEmit + biome check + Supabase Dashboard 验证。

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: 数据库迁移基础设施准备

- [x] T001 Create Supabase migration: ENUM types (role, project_type), profiles/projects/user_roles tables with constraints, foreign keys, RLS policies via Supabase MCP `apply_migration`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 表结构创建 — 所有用户故事的前置条件

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T002 Create ENUM type `public.role` with values: 质检员, 施工方, 管理员 via Supabase MCP `apply_migration`
- [x] T003 Create ENUM type `public.project_type` with values: 地产项目, 园区项目, 景观项目, 居住区项目, 政府项目 via Supabase MCP `apply_migration`
- [x] T004 Create `public.profiles` table (id UUID PK REFERENCES auth.users ON DELETE CASCADE, number TEXT NOT NULL UNIQUE, name TEXT NOT NULL, department TEXT NOT NULL, avatar_url TEXT NOT NULL DEFAULT '') via Supabase MCP `apply_migration`
- [x] T005 [P] Create `public.projects` table (id BIGINT PK GENERATED ALWAYS AS IDENTITY, name TEXT NOT NULL, city TEXT NOT NULL, client_name TEXT NOT NULL, type public.project_type NOT NULL) via Supabase MCP `apply_migration`
- [x] T006 Create `public.user_roles` table (id BIGINT PK GENERATED ALWAYS AS IDENTITY, user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE, project_id BIGINT NOT NULL REFERENCES projects(id) ON DELETE RESTRICT, role public.role NOT NULL, UNIQUE(user_id, project_id, role)) via Supabase MCP `apply_migration`
- [x] T007 Enable RLS on all three tables and create policies: profiles SELECT for authenticated, profiles INSERT/UPDATE/DELETE for admin only; projects SELECT for authenticated, projects INSERT/UPDATE/DELETE for admin only; user_roles SELECT scoped to own projects, user_roles INSERT/UPDATE/DELETE for admin only via Supabase MCP `apply_migration`

**Checkpoint**: 数据库表结构、约束和 RLS 策略全部就绪

---

## Phase 3: User Story 1 - 管理员创建用户和项目数据 (Priority: P1) 🎯 MVP

**Goal**: 管理员可以通过种子脚本创建用户、项目和角色绑定数据，所有约束正确生效

**Independent Test**: 通过 Supabase Dashboard 查询 profiles/projects/user_roles 表，验证种子数据完整且约束生效

### Implementation for User Story 1

- [x] T008 [US1] Create Auth test users via Supabase Dashboard: zhangqc@test.com (质检员), lishigong@test.com (施工方), wangguanli@test.com (管理员), all with password test123456, record their UUIDs
- [x] T009 [US1] Insert seed data via Supabase MCP `execute_sql`: 3 profiles records (referencing Auth UUIDs), 2 projects records (翡翠湾花园, 星河产业园), 5 user_roles records (covering all 3 roles and multi-project scenario per data-model.md seed plan)

**Checkpoint**: 种子数据就绪，约束验证通过

---

## Phase 4: User Story 2 - 登录用户按项目和角色读取数据 (Priority: P2)

**Goal**: RLS 策略正确限制数据可见范围，不同角色用户只能看到自己项目相关数据

**Independent Test**: 以不同角色用户身份查询各表，验证 RLS 策略正确限制数据可见范围

### Implementation for User Story 2

- [x] T010 [US2] Verify RLS policies by querying tables as different user roles via Supabase MCP `execute_sql`: test that 质检员 can read all profiles/projects but only own-project user_roles; test that 管理员 can read all data; test that admin-only write restrictions work

**Checkpoint**: RLS 策略验证通过，数据隔离正确

---

## Phase 5: User Story 3 - TypeScript 类型与数据库表对齐 (Priority: P3)

**Goal**: 前端 TypeScript 类型定义与 Supabase 数据库表结构完全对齐

**Independent Test**: tsc --noEmit 通过，且类型字段与数据库列一一对应

### Implementation for User Story 3

- [x] T011 [US3] Update TypeScript types in `lib/types.ts`: align Profile interface with profiles table (ensure avatar_url has default handling), align Project interface with projects table, align UserRole interface with user_roles table, verify all enum types (Role, ProjectType) match DB ENUM values exactly

**Checkpoint**: TypeScript 类型与数据库完全对齐，tsc --noEmit 通过

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: 最终验证和清理

- [x] T012 Run `npm run format` + `npm run lint` + `npx tsc --noEmit` to verify all checks pass
- [x] T013 Verify Supabase security advisors have no critical warnings for the new tables via Supabase MCP `get_advisors`
- [x] T014 Update `progress.md` to mark Phase 2 data layer tasks as complete

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: No dependency on Phase 1 (migration is applied directly via MCP)
- **User Story 1 (Phase 3)**: Depends on Foundational (Phase 2) completion — needs tables to exist
- **User Story 2 (Phase 4)**: Depends on User Story 1 (Phase 3) completion — needs seed data to test RLS
- **User Story 3 (Phase 5)**: Depends on Foundational (Phase 2) completion — needs final table structure to align types
- **Polish (Phase 6)**: Depends on all user stories complete

### User Story Dependencies

- **US1 (P1)**: Can start after Phase 2 — seeds the database
- **US2 (P2)**: Depends on US1 — needs seed data to verify RLS
- **US3 (P3)**: Can start after Phase 2 — independent of US1/US2 (type alignment only needs table structure)

### Parallel Opportunities

- T005 can run in parallel with T004 (different tables, but T006 depends on both)
- US3 (Phase 5) can run in parallel with US1 (Phase 3) after Phase 2 completes

---

## Parallel Example: Foundational Phase

```bash
# After ENUMs are created:
# T004 and T005 can run in parallel (different tables):
Task: "Create public.profiles table"
Task: "Create public.projects table"
# Then T006 (depends on T004 + T005):
Task: "Create public.user_roles table"
# Then T007 (depends on all tables):
Task: "Enable RLS and create policies"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 2: Foundational — create all tables, constraints, RLS
2. Complete Phase 3: User Story 1 — seed data
3. **STOP and VALIDATE**: Verify data via Supabase Dashboard
4. Continue with US2 (RLS verification) and US3 (type alignment)

### Incremental Delivery

1. Foundational → Tables ready
2. US1 → Seed data → Data verifiable in Dashboard (MVP!)
3. US2 → RLS verified → Security confirmed
4. US3 → Types aligned → Type-safe development ready
5. Polish → All checks pass

---

## Notes

- T001 is the consolidated migration task — can be split into T002-T007 if preferred, but all are applied via `apply_migration`
- Auth users (T008) must be created manually in Dashboard before seed SQL (T009) can reference their UUIDs
- RLS verification (T010) requires logging in as different users — may need to use Supabase Dashboard or API with different auth tokens
- Type alignment (T011) should be done after tables are finalized to avoid rework