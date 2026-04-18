# Implementation Plan: 工单组件与状态更改动作

**Branch**: `004-ticket-component-actions` | **Date**: 2026-04-12 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-ticket-component-actions/spec.md`

## Summary

实现工单详情组件（展示/编辑双模式）+ 状态更改动作（解决/拒绝/重新打开）+ 后端 API + 数据库表，直接对接真实 Supabase 数据库。本阶段跳过指派他人动作和变更记录（ticket_logs），状态更改操作点击直接执行无需补充输入。工单详情组件在移动端工单详情页 `/mobile/tickets/[id]` 中开发和测试。

## Technical Context

**Language/Version**: TypeScript 5.x
**Primary Dependencies**: Next.js 16.2.3 (App Router) + React 19.2 + @supabase/ssr + @supabase/supabase-js + shadcn/ui 4.2 + Radix UI + Tailwind CSS 4 + lucide-react
**Storage**: Supabase Postgres（已有 profiles/projects/user_roles 三张表，需新增 tickets 表）
**Testing**: MVP 阶段不写测试，类型检查 (`tsc --noEmit`) + Biome lint 通过即可
**Target Platform**: Web（移动端优先，PC 端后续集成）
**Project Type**: Web application（单一 Next.js 代码库）
**Performance Goals**: 无特殊性能要求，MVP 优先可用性
**Constraints**: 不写测试、不做推测性抽象、变更记录完全跳过、指派他人跳过
**Scale/Scope**: Demo/MVP，3 个测试用户、2 个项目

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| 原则 | 检查 | 状态 |
|------|------|------|
| I. MVP 优先交付 | 本阶段跳过指派他人和变更记录，状态操作直接执行不弹框——符合 MVP 精神 | PASS |
| II. 核心路径正确性 | 工单状态机转换严格按规格实现（待处理→已完成/已拒绝，已关闭→待处理）；数据模型与数据定义逐字段对应 | PASS |
| III. 最小抽象 | 工单详情组件是双端共用组件但本阶段只在移动端使用；不为单次使用创建抽象 | PASS |
| IV. 实用技术栈 | 使用 PRD 指定的 Next.js + Supabase + shadcn/ui + Tailwind，不添加额外依赖 | PASS |

所有原则通过，无需记录违规。

## Project Structure

### Documentation (this feature)

```text
specs/004-ticket-component-actions/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── api.md           # REST API contracts
└── checklists/
    └── requirements.md  # Spec quality checklist
```

### Source Code (repository root)

```text
app/
├── api/
│   └── tickets/
│       ├── route.ts                    # GET (list) + POST (create)
│       └── [id]/
│           ├── route.ts                # GET (detail) + PATCH (update)
│           └── actions/
│               ├── resolve/route.ts    # POST - 解决
│               ├── reject/route.ts     # POST - 拒绝
│               └── reopen/route.ts     # POST - 重新打开
├── mobile/
│   ├── layout.tsx                      # (existing) 移动端布局
│   └── tickets/
│       ├── page.tsx                     # (existing) 工单列表占位页
│       └── [id]/
│           └── page.tsx                 # 工单详情页（替换现有占位页）
components/
├── ui/                                 # (existing) shadcn/ui 组件
│   ├── badge.tsx                       # NEW - 状态 Badge
│   └── select.tsx                      # NEW - 下拉选择（Enum 编辑用）
├── ticket-detail.tsx                   # NEW - 工单详情组件（展示/编辑双模式）
├── ticket-actions.tsx                  # NEW - 操作按钮区（动态渲染）
├── user-avatar-chip.tsx                # (existing) 用户小组件
└── project-chip.tsx                    # NEW - 项目小组件
lib/
├── types.ts                            # (existing) 类型定义（无修改）
├── auth.ts                             # (existing) 鉴权工具
├── supabase/
│   ├── server.ts                       # (existing) Supabase 服务端客户端
│   └── client.ts                      # (existing) Supabase 浏览器客户端
└── tickets.ts                          # NEW - 工单数据访问函数
supabase/
├── migrations/
│   └── 00001_create_tickets_table.sql  # NEW - 创建 tickets 表 + RLS
└── seed.sql                            # NEW/UPDATE - 工单种子数据
```

**Structure Decision**: 单一 Next.js App Router 项目，API 路由放在 `app/api/` 下，共享组件放在 `components/`，数据访问函数放在 `lib/`。Supabase 迁移和种子数据放在 `supabase/` 目录。

## Complexity Tracking

无违规需要记录。