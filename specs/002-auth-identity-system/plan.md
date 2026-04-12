# Implementation Plan: 登录与身份系统 — 数据层

**Branch**: `002-auth-identity-system` | **Date**: 2026-04-12 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-auth-identity-system/spec.md`

## Summary

创建 Supabase 数据库的用户相关表（profiles、projects、user_roles），含 Postgres 原生 ENUM 类型、外键约束、唯一约束和 RLS 策略。使用 Supabase MCP 工具创建种子数据（Auth 用户 + profiles + projects + user_roles）。对齐 TypeScript 类型定义（lib/types.ts）与数据库表结构。

## Technical Context

**Language/Version**: TypeScript 5.x / PostgreSQL 15 (Supabase)
**Primary Dependencies**: Next.js 16.2.3 (App Router), Supabase (Auth + Database + RLS)
**Storage**: Supabase Postgres
**Testing**: tsc --noEmit + biome check（MVP 阶段不写测试）
**Target Platform**: Web (Vercel)
**Project Type**: Web application (全栈)
**Performance Goals**: N/A（Demo 项目，数据量小）
**Constraints**: 工号唯一、(user_id, project_id, role) 唯一约束、RLS 按项目隔离
**Scale/Scope**: 3 个测试用户、2 个测试项目

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| 原则 | 状态 | 说明 |
|------|------|------|
| I. MVP 优先交付 | PASS | 仅创建数据层，不含 UI，是后续功能的基础 |
| II. 核心路径正确性 | PASS | 表结构严格匹配《数据定义》文档字段 |
| III. 最小抽象 | PASS | 直接创建表和 RLS 策略，不做额外的数据访问层抽象 |
| IV. 实用技术栈 | PASS | 使用 Supabase（PRD 指定），不引入额外依赖 |

## Project Structure

### Documentation (this feature)

```text
specs/002-auth-identity-system/
├── spec.md              # Feature specification
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── checklists/
    └── requirements.md  # Quality checklist
```

### Source Code (repository root)

```text
app/                          # Next.js App Router（本阶段无变更）
lib/
├── types.ts                  # 更新：与数据库对齐的类型定义
└── utils.ts                  # 不变
supabase/
└── migrations/               # 新增：Supabase 迁移文件
    └── <timestamp>_create_user_tables.sql
```

**Structure Decision**: 使用 Next.js 单体仓库结构，Supabase 迁移文件放在 `supabase/migrations/` 目录下（Supabase CLI 标准位置）。TypeScript 类型定义在已有的 `lib/types.ts` 中更新。

## Complexity Tracking

无宪法违规需要记录。

---

## Phase 0: Research

### 研究任务

1. **Supabase 迁移最佳实践** — 使用 Supabase MCP 的 `apply_migration` 工具创建迁移，还是手动编写 SQL 文件？
   - **Decision**: 使用 Supabase MCP 的 `apply_migration` 工具直接创建迁移，这是最直接的方式，与 Supabase 官方文档一致
   - **Rationale**: MCP 工具直接操作远程 Supabase 项目，无需本地 CLI 环境，一步到位

2. **Supabase Auth 用户创建方式** — 种子数据中如何创建 Auth 用户？
   - **Decision**: 使用 Supabase MCP 工具。首先通过 Supabase Dashboard 或 Auth API 创建用户获取 UUID，然后通过 `execute_sql` 插入 profiles 记录
   - **Rationale**: Spec 澄清中已确认使用 Supabase 工具，MCP 不提供直接创建 Auth 用户的工具，需通过 Dashboard 手动创建后在 SQL 中引用 UUID

3. **RLS 策略中管理员判断** — 如何在 RLS 策略中判断当前用户是否为管理员？
   - **Decision**: 在 RLS 策略中通过子查询判断 `EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = '管理员')`
   - **Rationale**: 这是 Supabase 推荐的模式，在策略内直接查询角色表，无需额外的函数或触发器

4. **Postgres ENUM 命名规范** — 枚举类型如何命名？
   - **Decision**: 使用 `public.<entity>_<field>` 格式，如 `public.role` 和 `public.project_type`
   - **Rationale**: 简洁且与表字段对应，避免全局命名冲突

5. **profiles 表的 id 与 auth.users 关联** — 是否需要外键约束？
   - **Decision**: profiles.id 设置为 `references auth.users(id) ON DELETE CASCADE`，确保 Auth 用户删除时自动清理 profiles
   - **Rationale**: Supabase 官方示例推荐此模式，且与澄清 Q3 一致（profiles 删除时 CASCADE 到 user_roles，auth.users 删除时 CASCADE 到 profiles）

6. **RLS 策略设计** — profiles 和 projects 表的可读范围
   - **Decision**:
     - profiles: 所有登录用户可读全部（因为工单详情中需要显示其他用户信息）；仅管理员可写
     - projects: 所有登录用户可读全部（因为下拉选择项目时需要）；仅管理员可写
     - user_roles: 登录用户只能读取自己所在项目的记录；仅管理员可写
   - **Rationale**: 工单系统需要跨项目显示用户信息（如创建人、责任人），因此 profiles 需要全局可读。projects 同理，用户需要看到项目列表。user_roles 是权限敏感数据，按项目隔离。

---

## Phase 1: Design & Contracts

### Data Model

详见 [data-model.md](./data-model.md)

### Contracts

本阶段为纯数据层，无外部接口/ API 契约需要定义。

### Quickstart

详见 [quickstart.md](./quickstart.md)

### Constitution Re-check (Post-Design)

| 原则 | 状态 | 说明 |
|------|------|------|
| I. MVP 优先交付 | PASS | 仅做最小必要的数据层 |
| II. 核心路径正确性 | PASS | 表结构与数据定义文档完全一致 |
| III. 最小抽象 | PASS | 无额外抽象层，直接 SQL + TypeScript 类型 |
| IV. 实用技术栈 | PASS | 使用 Supabase 原生功能 |