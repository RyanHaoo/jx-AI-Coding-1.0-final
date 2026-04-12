# Research: 登录与身份系统 — 数据层

## 1. Supabase 迁移方式

**Decision**: 使用 Supabase MCP 的 `apply_migration` 工具直接创建迁移

**Rationale**: MCP 工具直接操作远程 Supabase 项目，一步到位。无需本地 `supabase` CLI 环境配置，且迁移会被记录到 `supabase_migrations` 表中，便于追踪。

**Alternatives considered**:
- 本地 `supabase migration new` + `supabase db push`：需要本地 CLI 环境和项目链接，配置复杂
- 直接在 Dashboard SQL Editor 执行：无迁移记录，不利于版本控制

## 2. Auth 用户创建方式

**Decision**: 通过 Supabase Dashboard 手动创建 Auth 用户（邮箱+密码），获取 UUID 后在 SQL 种子数据中引用

**Rationale**: Supabase MCP 不提供直接创建 Auth 用户的工具。Dashboard 创建是最可靠的方式，创建后可获取 auth.uid() 用于关联 profiles 表。

**Alternatives considered**:
- SQL 直接插入 `auth.users`：需要处理加密密码、触发器等复杂逻辑，不稳定
- Admin API (`supabase.auth.admin.createUser()`)：需要 service_role key，MCP 中未暴露

## 3. RLS 管理员判断方式

**Decision**: 在 RLS 策略中使用子查询 `EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = '管理员')`

**Rationale**: 直接查询角色表，逻辑清晰，无需额外函数或触发器。Supabase 官方推荐此模式。

**Alternatives considered**:
- 创建 `is_admin()` 辅助函数：增加抽象，违反最小抽象原则
- 使用 JWT claims：需要自定义 Auth hook，复杂度高

## 4. ENUM 类型命名

**Decision**: 使用 `public.role` 和 `public.project_type`

**Rationale**: 简洁，与表字段名对应。Postgres ENUM 是 schema-level 对象，放在 public schema 下即可。

**Alternatives considered**:
- `user_role_type` / `project_category_type`：命名冗余，无额外价值

## 5. profiles.id 外键关联 auth.users

**Decision**: `profiles.id REFERENCES auth.users(id) ON DELETE CASCADE`

**Rationale**: Supabase 官方示例推荐此模式。当 Auth 用户被删除时，自动清理 profiles 记录，进而 CASCADE 到 user_roles。

**Alternatives considered**:
- 不设外键，只做逻辑关联：可能导致孤立记录
- `ON DELETE SET NULL`：profiles.id 是主键，不能为 NULL

## 6. RLS 策略设计

**Decision**:
- `profiles`: 全表可读（所有登录用户）；仅管理员可 INSERT/UPDATE/DELETE
- `projects`: 全表可读（所有登录用户）；仅管理员可 INSERT/UPDATE/DELETE
- `user_roles`: 按项目隔离可读（只能看到自己所在项目的记录）；仅管理员可 INSERT/UPDATE/DELETE

**Rationale**: 工单系统需要显示跨项目的用户信息（创建人、责任人），因此 profiles 和 projects 需全局可读。user_roles 是权限敏感数据，按项目隔离读取。

**Alternatives considered**:
- profiles 按项目隔离可读：工单详情中无法显示其他项目的创建人/责任人信息
- 所有表都按项目隔离：过于严格，影响功能可用性