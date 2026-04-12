# Data Model: 登录与身份系统 — 界面与交互层

**Feature**: 003-auth-identity-ui | **Date**: 2026-04-12

## Existing Entities (Phase 2 — 已创建)

以下表已在阶段 2 数据层中创建，本阶段直接使用。

### profiles

| Field | Type | Constraints | Notes |
|-------|------|------------|-------|
| id | UUID | PK, REFERENCES auth.users(id) ON DELETE CASCADE | 关联 Supabase Auth |
| number | TEXT | NOT NULL, UNIQUE | 工号，登录凭据 |
| name | TEXT | NOT NULL | 姓名 |
| department | TEXT | NOT NULL | 部门 |
| avatar_url | TEXT | NOT NULL, DEFAULT '' | 头像 URL |

### projects

| Field | Type | Constraints | Notes |
|-------|------|------------|-------|
| id | BIGINT | PK, GENERATED ALWAYS AS IDENTITY | 自增主键 |
| name | TEXT | NOT NULL | 项目名称 |
| city | TEXT | NOT NULL | 城市 |
| client_name | TEXT | NOT NULL | 客户公司名称 |
| type | project_type | NOT NULL | 项目类型枚举 |

### user_roles

| Field | Type | Constraints | Notes |
|-------|------|------------|-------|
| id | BIGINT | PK, GENERATED ALWAYS AS IDENTITY | 自增主键 |
| user_id | UUID | NOT NULL, REFERENCES profiles(id) ON DELETE CASCADE | 关联用户 |
| project_id | BIGINT | NOT NULL, REFERENCES projects(id) ON DELETE RESTRICT | 关联项目 |
| role | role | NOT NULL | 角色枚举：质检员/施工方/管理员 |
| | | UNIQUE(user_id, project_id, role) | 防止重复绑定 |

## New Entities (本阶段新增)

### Session State (Cookie)

身份选择状态，通过 httpOnly cookie 存储。

| Cookie Key | Type | Description |
|------------|------|-------------|
| `active_project_id` | string | 当前选中的项目 ID（数字字符串） |
| `active_project_name` | string | 当前选中的项目名称 |
| `active_role` | string | 当前选中的角色（质检员/施工方/管理员） |

**Cookie 属性**: httpOnly=true, secure=true, sameSite=lax, path=/

### Identity Option (前端类型)

弹框中展示的身份选项，来自 user_roles + projects 联合查询。

```typescript
interface IdentityOption {
  projectId: number;
  projectName: string;
  role: Role;
}
```

### Login Action Input

Server Action 接收的登录参数。

```typescript
// app/login/actions.ts
interface LoginInput {
  number: string;  // 工号
  password: string;
  redirect?: string;  // 可选的重定向路径
}
```

### Login Action Response

登录 Server Action 的返回类型。

```typescript
interface LoginResult {
  success: boolean;
  error?: string;           // 错误消息（中文）
  needsIdentitySelect?: boolean;  // 是否需要选择身份
  identities?: IdentityOption[];  // 可选身份列表
  redirectUrl?: string;     // 跳转 URL
}
```

## Entity Relationships

```
auth.users (Supabase Auth)
  └── 1:1 → profiles.id
              └── 1:N → user_roles.user_id
                          └── N:1 → projects.id

Cookie (active_project_id, active_project_name, active_role)
  └── 存储 user_roles 中的一条记录信息
  └── 被 proxy.ts 和 Server Components 读取
```

## State Transitions

### 登录流程状态机

```
[未登录] ──输入工号+密码──→ [验证中]
  │                          │
  │                    ┌─────┴─────┐
  │                    │           │
  │              验证成功      验证失败
  │                    │           │
  │              ┌─────┴─────┐   │
  │              │           │   │
  │         单身份       多身份   │
  │              │           │   │
  │         直接进入    弹出选择   │
  │              │           │   │
  │         写入cookie  写入cookie│
  │              │           │   │
  │              └─────┬─────┘   │
  │                    │         │
  │              跳转目标页面     │
  │                              │
  │                        显示错误提示
  │                        保留工号输入
  └──────────────────────────────┘
```

### 身份切换状态机

```
[当前身份A] ──点击切换──→ [弹出选择弹框]
  │                          │
  │                    选择身份B
  │                          │
  │              ┌───────────┘
  │              │
  │         更新 cookie
  │              │
  │         router.refresh()
  │              │
  │         [当前身份B]
  │
  └── 点击退出 ──→ supabase.auth.signOut() ──→ 清除 cookie ──→ /login
```