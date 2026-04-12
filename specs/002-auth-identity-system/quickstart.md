# Quickstart: 登录与身份系统 — 数据层

## Prerequisites

- Supabase 项目已创建并可访问
- Supabase MCP 已配置（用于执行迁移和 SQL）

## Step 1: 创建数据库迁移

使用 Supabase MCP `apply_migration` 工具创建迁移，包含：

1. 创建 ENUM 类型（`role`, `project_type`）
2. 创建 `profiles` 表（含 UNIQUE 约束、外键关联 auth.users）
3. 创建 `projects` 表
4. 创建 `user_roles` 表（含唯一约束、外键）
5. 启用 RLS 并创建策略

## Step 2: 创建 Auth 测试用户

在 Supabase Dashboard → Authentication → Users 中手动创建 3 个用户：

| Email | Password | 用途 |
|-------|----------|------|
| zhangqc@test.com | test123456 | 质检员 |
| lishigong@test.com | test123456 | 施工方 |
| wangguanli@test.com | test123456 | 管理员 |

记录每个用户的 UUID。

## Step 3: 插入种子数据

使用 Supabase MCP `execute_sql` 工具插入种子数据：

1. 插入 profiles 记录（引用 Step 2 获取的 UUID）
2. 插入 projects 记录
3. 插入 user_roles 记录

## Step 4: 更新 TypeScript 类型

更新 `lib/types.ts` 中的类型定义，确保与数据库表结构对齐。

## Step 5: 验证

1. 通过 Supabase Dashboard 查询各表，确认数据完整
2. 运行 `npx tsc --noEmit` 确认类型检查通过
3. 运行 `npm run lint` 确认 Biome 检查通过