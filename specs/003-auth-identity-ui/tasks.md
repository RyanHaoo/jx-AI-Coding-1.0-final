# Tasks: 登录与身份系统 — 界面与交互层

**Input**: Design documents from `/specs/003-auth-identity-ui/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: MVP 阶段不写测试，通过 tsc --noEmit + biome check + 手动测试验证。

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: 安装依赖、配置环境变量、创建 Supabase 客户端基础设施

- [x] T001 Install Supabase dependencies: `npm install @supabase/supabase-js @supabase/ssr`
- [x] T002 [P] Add environment variables to `.env.local`: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (obtain from Supabase Dashboard → Settings → API)
- [x] T003 [P] Create browser-side Supabase client in `lib/supabase/client.ts` using `createBrowserClient` from `@supabase/ssr`
- [x] T004 Create server-side Supabase client in `lib/supabase/server.ts` using `createServerClient` from `@supabase/ssr` with `cookies()` from `next/headers`
- [x] T005 Create proxy session refresh logic in `lib/supabase/proxy.ts` using `createServerClient` with `getClaims()` for auth token refresh
- [x] T006 Create Next.js 16 proxy entry in `proxy.ts` (project root) that imports and calls `updateSession` from `lib/supabase/proxy.ts`, with `config.matcher` excluding static assets
- [x] T007 [P] Add `IdentityOption` interface and `LoginResult` type to `lib/types.ts` per data-model.md definitions

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 身份 cookie 工具函数 + CSS 设计系统变量更新 — 所有用户故事的前置条件

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T008 Create identity cookie utility functions in `lib/auth.ts`: `getIdentityFromCookie()` (reads active_project_id, active_project_name, active_role from cookies), `writeIdentityCookie(projectId, projectName, role)` (sets httpOnly cookies), `clearIdentityCookie()` (deletes cookies), `getIdentitiesForUser(userId)` (queries user_roles + projects tables for identity options)
- [x] T009 [P] Update CSS variables in `app/globals.css` to match ConstructIntel Pro design system: `--primary` → `#005ac2`, `--primary-foreground` → `#f7f7ff`, `--background` → `#f7f9fb`, `--card` → `#ffffff`, `--input` → `#e8eff3`, `--muted-foreground` → `#566166`, `--border` → `#a9b4b9`; update `:root` and `.dark` blocks; set `--radius` to `0.25rem`
- [x] T010 [P] Add Noto Sans SC font via `next/font/google` in `app/layout.tsx`, add to CSS font stack as fallback for CJK characters

**Checkpoint**: Supabase 客户端就绪、cookie 工具函数可用、CSS 变量已匹配设计系统

---

## Phase 3: User Story 1 - 用户通过工号密码登录系统 (Priority: P1) 🎯 MVP

**Goal**: 用户可以在登录页输入工号和密码，系统通过 Supabase Auth 验证身份，登录成功后跳转

**Independent Test**: 用测试账号 zhangqc/test123456 登录，验证跳转成功；输入错误密码验证错误提示

### Implementation for User Story 1

- [x] T011 [US1] Add `IdentityOption` and `LoginResult` type exports to `lib/types.ts` if not done in T007
- [x] T012 [US1] Create login Server Action in `app/login/actions.ts`: `login(formData)` — lookup profile by number → get email via admin API → `signInWithPassword` → query identities → return LoginResult; `selectIdentity(formData)` — write identity cookie → redirect
- [x] T013 [US1] Rewrite `app/login/page.tsx` to strictly match Stitch "响应式极简版" design: centered card on `#f7f9fb` background, Building2 icon + "建筑施工质检情报员" title + "CONSTRUCTION INTELLIGENCE" subtitle, Badge icon + 工号 input, Lock icon + 密码 input, ArrowRight icon + "登录" primary button (`#005ac2`), ShieldCheck icon + security notice, copyright footer; responsive layout (mobile + desktop); form calls `login` Server Action; loading/disabled state on submit; error message display; redirect param support; identity dialog trigger for multi-identity users
- [x] T014 [US1] Install shadcn/ui Dialog component: `npx shadcn@latest add dialog`
- [x] T015 [US1] Create `components/identity-dialog.tsx`: shared dialog component for identity selection; lists all IdentityOption entries (project name + role); clicking an option calls `selectIdentity` (login flow) or `switchIdentity` (switch flow) Server Action; supports both login and switch modes via props
- [x] T016 [US1] Integrate identity dialog into login page: after `login` action returns `needsIdentitySelect: true`, show IdentityDialog with identities list; on selection, call `selectIdentity` action

**Checkpoint**: 用户可以通过工号密码登录，单身份直接跳转，多身份弹出选择弹框

---

## Phase 4: User Story 4 - 未登录用户被鉴权守卫拦截 (Priority: P2)

**Goal**: 未登录用户访问受保护路由时被重定向到登录页，非管理员访问 PC 端被重定向到移动端首页

**Independent Test**: 未登录访问 `/mobile/assistant` → 重定向到 `/login?redirect=/mobile/assistant`; 质检员访问 `/dashboard/overview` → 重定向到 `/mobile/assistant`

### Implementation for User Story 4

- [x] T017 [US4] Implement auth guard logic in `lib/supabase/proxy.ts` `updateSession()`: after `getClaims()`, check if user is authenticated; if not authenticated and path is `/mobile/*` or `/dashboard/*` → redirect to `/login?redirect=<path>`; if authenticated and path is `/dashboard/*` and `active_role` cookie is not '管理员' → redirect to `/mobile/assistant`; if authenticated and path is `/login` → redirect to `/mobile/assistant` (non-admin) or `/dashboard/overview` (admin); allow `/` and `/login` for unauthenticated users
- [x] T018 [US4] Add admin role check in `app/dashboard/layout.tsx` Server Component: verify `active_role` cookie is '管理员' via `getIdentityFromCookie()`, if not redirect to `/mobile/assistant`

**Checkpoint**: 鉴权守卫生效，未登录/非管理员访问被正确拦截

---

## Phase 5: User Story 2 - 用户选择项目/角色身份 (Priority: P2)

**Goal**: 多身份用户登录后可弹框选择身份，已登录用户可切换身份

**Independent Test**: 用 wangguanli 登录验证多身份弹框；登录后点击切换身份验证弹框和刷新

### Implementation for User Story 2

- [x] T019 [US2] Add `switchIdentity` Server Action in `lib/auth.ts`: update identity cookie → `revalidatePath('/', 'layout')` (no redirect, caller does `router.refresh()`)
- [x] T020 [US2] Update `components/identity-dialog.tsx` to support switch mode: when `mode="switch"`, on selection call `switchIdentity` action then `router.refresh()`; when `mode="login"`, on selection call `selectIdentity` action (which redirects)

**Checkpoint**: 身份选择弹框同时支持登录和切换两种场景

---

## Phase 6: User Story 3 - 用户通过导航模块管理身份 (Priority: P3)

**Goal**: 移动端侧边目录和 PC 端顶栏显示用户信息和退出/切换操作

**Independent Test**: 登录后查看移动端侧边目录底部用户信息；点击退出验证跳转；点击切换身份验证弹框

### Implementation for User Story 3

- [x] T021 [P] [US3] Create `components/user-avatar-chip.tsx`: displays avatar (circle with fallback initial from name) + department + name + current project/role; compact horizontal layout; reads identity from cookie via Server Component props
- [x] T022 [US3] Create signout Route Handler in `app/auth/signout/route.ts`: POST handler — call `supabase.auth.signOut()` → clear identity cookies via `clearIdentityCookie()` → `revalidatePath('/', 'layout')` → redirect to `/login`
- [x] T023 [US3] Update `components/mobile-side-drawer.tsx`: add UserAvatarChip at bottom of drawer showing current user info + identity; add "切换身份" button (opens IdentityDialog with mode="switch"); add "退出登录" button (form POST to `/auth/signout`)
- [x] T024 [US3] Update `components/dashboard-top-bar.tsx`: replace placeholder user area with UserAvatarChip (avatar + name only) + DropdownMenu with "切换身份" (opens IdentityDialog with mode="switch") and "退出登录" (form POST to `/auth/signout`)
- [x] T025 [US3] Update `app/mobile/layout.tsx`: pass user profile and identity data as props from Server Component to MobileSideDrawer
- [x] T026 [US3] Update `app/dashboard/layout.tsx`: pass user profile and identity data as props from Server Component to DashboardTopBar; verify admin role (already done in T018)

**Checkpoint**: 移动端和 PC 端都展示用户信息，退出和切换身份功能正常

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: 最终验证、格式化、类型检查

- [x] T027 Run `npm run format` + `npm run lint` + `npx tsc --noEmit` to verify all checks pass
- [ ] T028 Verify login flow end-to-end: test zhangqc (single identity), lishigong (single identity), wangguanli (multi-identity); test wrong password; test redirect param; test signout; test identity switch
- [x] T029 Update `progress.md` to mark Phase 2 UI tasks as complete
- [x] T030 Verify Supabase security advisors have no critical warnings via Supabase MCP `get_advisors`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 (needs Supabase clients for auth.ts)
- **User Story 1 (Phase 3)**: Depends on Phase 2 (needs cookie utils, CSS variables)
- **User Story 4 (Phase 4)**: Depends on Phase 2 (needs proxy.ts and auth.ts)
- **User Story 2 (Phase 5)**: Depends on Phase 3 (needs IdentityDialog component from US1)
- **User Story 3 (Phase 6)**: Depends on Phase 5 (needs IdentityDialog switch mode from US2) and Phase 2 (needs auth.ts)
- **Polish (Phase 7)**: Depends on all user stories complete

### User Story Dependencies

- **US1 (P1)**: Can start after Phase 2 — no dependency on other stories
- **US4 (P2)**: Can start after Phase 2 — no dependency on US1 (proxy.ts is independent), but practically needs login page to test redirect
- **US2 (P2)**: Depends on US1 — needs IdentityDialog component and login action
- **US3 (P3)**: Depends on US2 — needs IdentityDialog switch mode; also needs signout route

### Parallel Opportunities

- T002, T003, T007 can run in parallel within Phase 1
- T009, T010 can run in parallel within Phase 2
- US1 (Phase 3) and US4 (Phase 4) can partially overlap: T017-T018 can be done while T013-T016 are in progress
- T021 can run in parallel with T022-T024 within Phase 6

---

## Parallel Example: Phase 1

```bash
# After T001 (npm install) completes, launch these in parallel:
Task: "Add environment variables to .env.local" (T002)
Task: "Create browser-side Supabase client" (T003)
Task: "Add IdentityOption and LoginResult types" (T007)

# Then sequentially:
Task: "Create server-side Supabase client" (T004) — needs package installed
Task: "Create proxy session refresh logic" (T005) — needs package installed
Task: "Create proxy.ts entry" (T006) — needs T005
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup — install deps, create Supabase clients
2. Complete Phase 2: Foundational — auth.ts, CSS variables, font
3. Complete Phase 3: User Story 1 — login page + identity dialog
4. **STOP and VALIDATE**: Test login with all 3 accounts, verify single/multi-identity flows
5. Continue with US4 (auth guard), US2 (switch identity), US3 (nav user module)

### Incremental Delivery

1. Setup + Foundational → Infrastructure ready
2. US1 → Login works → Can authenticate and access app (MVP!)
3. US4 → Auth guard active → Protected routes enforced
4. US2 → Identity switch works → Multi-identity users can switch
5. US3 → Nav shows user info → Full identity management
6. Polish → All checks pass, progress updated

---

## Notes

- T012 (login action) needs service role key to query profiles + admin API for email lookup; consider using `SUPABASE_SERVICE_ROLE_KEY` env var for server-side admin operations
- Proxy (T017) uses `getClaims()` (lightweight JWT check) not `getUser()` (network call) for performance
- Identity dialog (T015, T020) is a shared component — login mode uses Server Action with redirect, switch mode uses Server Action with `router.refresh()`
- Signout (T022) uses Route Handler (POST) instead of Server Action to support form submission from both mobile and PC layouts
- CSS variable updates (T009) affect all shadcn/ui components globally — verify existing components still look correct after update