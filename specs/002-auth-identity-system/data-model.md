# Data Model: 登录与身份系统 — 数据层

## ENUM Types

### `public.role`

| Value | Description |
|-------|-------------|
| 质检员 | 发现问题、发起报事（移动端） |
| 施工方 | 接收并处理工单（移动端） |
| 管理员 | 全局监控与干预（PC 端） |

### `public.project_type`

| Value | Description |
|-------|-------------|
| 地产项目 | — |
| 园区项目 | — |
| 景观项目 | — |
| 居住区项目 | — |
| 政府项目 | — |

## Tables

### `public.profiles`

> 用户业务信息表，通过 id 关联 Supabase Auth。

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, REFERENCES auth.users(id) ON DELETE CASCADE | 对应 Supabase Auth 用户 ID |
| number | TEXT | NOT NULL, UNIQUE | 用户工号，不可重复不可编辑，用于登录 |
| name | TEXT | NOT NULL | 用户姓名 |
| department | TEXT | NOT NULL | 所在部门 |
| avatar_url | TEXT | NOT NULL DEFAULT '' | 头像图片链接 |

**RLS Policies**:
- SELECT: 所有登录用户（`authenticated` role）可读全表
- INSERT/UPDATE/DELETE: 仅管理员（通过 user_roles 判断）

### `public.projects`

> 施工项目表。

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT | PK, GENERATED ALWAYS AS IDENTITY | 自增主键 |
| name | TEXT | NOT NULL | 项目名称 |
| city | TEXT | NOT NULL | 项目城市 |
| client_name | TEXT | NOT NULL | 客户公司名称 |
| type | public.project_type | NOT NULL | 项目类型枚举 |

**RLS Policies**:
- SELECT: 所有登录用户可读全表
- INSERT/UPDATE/DELETE: 仅管理员

### `public.user_roles`

> 用户 × 项目 × 角色三元组关联表。

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT | PK, GENERATED ALWAYS AS IDENTITY | 自增主键 |
| user_id | UUID | NOT NULL, REFERENCES public.profiles(id) ON DELETE CASCADE | 关联用户 |
| project_id | BIGINT | NOT NULL, REFERENCES public.projects(id) ON DELETE RESTRICT | 关联项目 |
| role | public.role | NOT NULL | 角色枚举 |

**Unique Constraint**: `(user_id, project_id, role)` — 防止同一用户在同一项目重复绑定同一角色

**RLS Policies**:
- SELECT: 只能读取自己所在项目的记录（通过 `EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.project_id = user_roles.project_id)` 判断）
- INSERT/UPDATE/DELETE: 仅管理员

## Relationships

```
auth.users (1) ──── (1) profiles
                              │
                              │ 1:N (CASCADE)
                              ▼
                         user_roles ──── N:1 (RESTRICT) ──── projects
```

- `profiles.id` → `auth.users.id` (1:1, CASCADE on delete)
- `user_roles.user_id` → `profiles.id` (N:1, CASCADE on delete)
- `user_roles.project_id` → `projects.id` (N:1, RESTRICT on delete)

## TypeScript Type Mapping

| DB Column Type | TypeScript Type |
|----------------|-----------------|
| UUID | string |
| BIGINT (identity) | number |
| TEXT | string |
| public.role | Role (union type) |
| public.project_type | ProjectType (union type) |
| TEXT DEFAULT '' | string |

## Seed Data Plan

### 测试用户（需先在 Supabase Dashboard 创建 Auth 用户）

| 工号 | 姓名 | 部门 | 角色 | 密码（Auth） |
|------|------|------|------|-------------|
| QC001 | 张质检 | 质检部 | 质检员 | test123456 |
| SV001 | 李施工 | 施工部 | 施工方 | test123456 |
| AD001 | 王管理 | 管理部 | 管理员 | test123456 |

### 测试项目

| 名称 | 城市 | 客户 | 类型 |
|------|------|------|------|
| 翡翠湾花园 | 深圳 | 碧桂园集团 | 地产项目 |
| 星河产业园 | 广州 | 星河控股 | 园区项目 |

### 角色绑定

| 用户 | 项目 | 角色 |
|------|------|------|
| 张质检 | 翡翠湾花园 | 质检员 |
| 李施工 | 翡翠湾花园 | 施工方 |
| 王管理 | 翡翠湾花园 | 管理员 |
| 张质检 | 星河产业园 | 质检员 |
| 王管理 | 星河产业园 | 管理员 |

> 张质检在两个项目中都担任质检员，王管理在两个项目中都担任管理员——验证多项目多角色场景。