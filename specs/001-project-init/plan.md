# Implementation Plan: 项目初始化

**Branch**: `001-project-init` | **Date**: 2026-04-12 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-project-init/spec.md`

## Summary

阶段一"项目初始化"：基于 Next.js 16 App Router 脚手架，建立完整路由结构、全局类型定义、双端共享布局、首页双端入口和登录页 UI 壳。本阶段不涉及 Supabase 对接或鉴权守卫，为后续阶段搭建骨架。

## Technical Context

**Language/Version**: TypeScript 5.x, Next.js 16.2.3 (App Router)
**Primary Dependencies**: React 19.2, shadcn/ui 4.2, lucide-react 1.8, Tailwind CSS 4, Biome 2.2
**Storage**: N/A（本阶段不涉及数据库）
**Testing**: N/A（MVP 阶段不写测试，类型检查 + lint 即可）
**Target Platform**: Web（移动端浏览器 + PC 浏览器）
**Project Type**: Web application (全栈 Next.js 单一代码库)
**Performance Goals**: 首页 LCP < 3 秒
**Constraints**: 不对接 Supabase Auth，不实现鉴权守卫，不做防御性编程
**Scale/Scope**: 7 个路由页面，5 个类型实体，2 个共享布局

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| 原则 | 状态 | 说明 |
|------|------|------|
| I. MVP 优先交付 | PASS | 仅搭建路由骨架和 UI 壳，不做过早集成 |
| II. 核心路径正确性 | PASS | 路由结构和类型定义严格匹配 PRD，为后续核心路径奠定基础 |
| III. 最小抽象 | PASS | 不引入额外模式/包装器，布局组件直接内联 |
| IV. 实用技术栈 | PASS | 完全使用 PRD 指定的 Next.js + shadcn/ui + Tailwind |

**Gate Result**: PASS — 无违规

## Project Structure

### Documentation (this feature)

```text
specs/001-project-init/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── checklists/
    └── requirements.md  # Spec quality checklist
```

### Source Code (repository root)

```text
app/
├── layout.tsx                    # Root layout (已存在，需更新)
├── page.tsx                      # 首页 - 双端入口 (需重写)
├── globals.css                   # 全局样式 (已存在)
├── login/
│   └── page.tsx                  # 登录页 UI 壳
├── mobile/
│   ├── layout.tsx                # 移动端共享布局 (顶栏 + 侧边目录)
│   ├── assistant/
│   │   └── page.tsx              # 智能助手占位页
│   └── tickets/
│       ├── page.tsx              # 工单列表占位页
│       └── [id]/
│           └── page.tsx          # 工单详情占位页
└── dashboard/
    ├── layout.tsx                # PC 端共享布局 (顶栏 + 侧边导航)
    ├── overview/
    │   └── page.tsx              # 数据大盘占位页
    ├── tickets/
    │   └── page.tsx              # 工单中心占位页
    └── knowledge/
        └── page.tsx              # 知识运营占位页

lib/
├── utils.ts                      # 已存在
└── types.ts                      # 全局类型定义 (新增)

components/
├── ui/                           # shadcn/ui 组件 (已存在)
├── mobile-top-bar.tsx            # 移动端顶栏组件
├── mobile-side-drawer.tsx        # 移动端侧边目录组件
├── dashboard-top-bar.tsx         # PC 端顶栏组件
└── dashboard-side-nav.tsx        # PC 端侧边导航组件
```

**Structure Decision**: Next.js App Router 单一代码库，路由即文件夹结构。移动端和 PC 端分别有独立的 `layout.tsx` 提供共享布局，布局组件抽取到 `components/` 目录。

## Complexity Tracking

无违规，不需要记录。
