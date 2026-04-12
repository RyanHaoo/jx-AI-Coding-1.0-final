# API Route Contracts: 登录与身份系统 — 界面与交互层

**Feature**: 003-auth-identity-ui | **Date**: 2026-04-12

## Server Actions

### `login(formData: FormData) → LoginResult`

**文件**: `app/login/actions.ts`

**功能**: 工号密码登录

**输入** (FormData fields):
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| number | string | yes | 工号 |
| password | string | yes | 密码 |
| redirect | string | no | 登录后重定向路径 |

**处理流程**:
1. 用 number 查询 profiles 表获取 id
2. 用 id 从 auth.users 获取 email（通过 admin API）
3. 用 email + password 调用 `signInWithPassword`
4. 登录成功 → 查询 user_roles 获取身份列表
5. 单身份 → 自动写入 cookie → redirect
6. 多身份 → 返回 `needsIdentitySelect: true` + 身份列表

**输出**:
```typescript
// 成功 - 单身份
{ success: true, redirectUrl: "/mobile/assistant" }

// 成功 - 多身份（需要前端弹框选择）
{ success: true, needsIdentitySelect: true, identities: [...] }

// 失败
{ success: false, error: "工号或密码错误" }
```

---

### `selectIdentity(formData: FormData) → void`

**文件**: `app/login/actions.ts`（或 `lib/auth.ts` 中 Server Action）

**功能**: 选择身份并写入 cookie

**输入** (FormData fields):
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| projectId | string | yes | 项目 ID |
| projectName | string | yes | 项目名称 |
| role | string | yes | 角色名称 |
| redirect | string | no | 选择后重定向路径 |

**处理流程**:
1. 将 projectId、projectName、role 写入 httpOnly cookie
2. `revalidatePath('/', 'layout')`
3. `redirect(redirect || '/mobile/assistant')`

---

### `switchIdentity(formData: FormData) → void`

**文件**: `lib/auth.ts`

**功能**: 切换身份（已登录用户）

**输入** (FormData fields):
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| projectId | string | yes | 新项目 ID |
| projectName | string | yes | 新项目名称 |
| role | string | yes | 新角色 |

**处理流程**:
1. 更新 cookie（覆盖旧值）
2. `revalidatePath('/', 'layout')`

---

### `signout() → void`

**文件**: `app/auth/signout/route.ts` (Route Handler POST)

**功能**: 退出登录

**处理流程**:
1. 调用 `supabase.auth.signOut()`
2. 清除身份 cookie（active_project_id, active_project_name, active_role）
3. `revalidatePath('/', 'layout')`
4. 重定向到 `/login`

## Route Handler

### `POST /auth/signout`

**文件**: `app/auth/signout/route.ts`

**请求**: 无 body

**响应**: 302 重定向到 `/login`

## Proxy Routes (proxy.ts)

### 鉴权规则

| 路径模式 | 未登录 | 已登录非管理员 | 已登录管理员 |
|----------|--------|---------------|-------------|
| `/` | ✅ 放行 | ✅ 放行 | ✅ 放行 |
| `/login` | ✅ 放行 | → 重定向到端首页 | → 重定向到端首页 |
| `/mobile/*` | → `/login?redirect=<path>` | ✅ 放行 | ✅ 放行 |
| `/dashboard/*` | → `/login?redirect=<path>` | → `/mobile/assistant` | ✅ 放行 |

**判断逻辑**:
1. 调用 `supabase.auth.getClaims()` 获取用户身份
2. 未登录（无 claims）→ 检查是否白名单路径，否则重定向到 `/login`
3. 已登录 → 读取 `active_role` cookie 判断是否管理员
4. `/dashboard/*` 且非管理员 → 重定向到 `/mobile/assistant`
5. `/login` 且已登录 → 重定向到 `/mobile/assistant`（非管理员）或 `/dashboard/overview`（管理员）

## Utility Functions

### `lib/auth.ts`

| Function | Description | 用途 |
|----------|-------------|------|
| `getIdentityFromCookie()` | 从 cookie 读取当前身份 | Server Components |
| `writeIdentityCookie(projectId, projectName, role)` | 写入身份 cookie | Server Actions |
| `clearIdentityCookie()` | 清除身份 cookie | 退出登录 |
| `getIdentitiesForUser(userId)` | 查询用户所有身份选项 | 登录后/切换时 |