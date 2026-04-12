# Implementation Plan: 重构移动端与PC端通用页面框架

**Branch**: `003-stitch-layout-refactor` | **Date**: 2026-04-12 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-stitch-layout-refactor/spec.md`

## Summary

严格遵循 Stitch MCP 设计系统，重构移动端和PC端两个通用页面框架组件。PC端采用左侧固定侧边栏+顶栏面包屑+主内容区布局；移动端采用顶栏+侧边抽屉+主内容区布局。统一使用 Stitch 设计系统的色彩 token 和音调分层法，替换当前的 zinc 系列和 border 实线分割。

## Technical Context

**Language/Version**: TypeScript 5.x
**Primary Dependencies**: Next.js 16.2.3 (App Router), React 19.2, shadcn/ui 4.2, lucide-react 1.8, Tailwind CSS 4
**Storage**: N/A（纯 UI 框架重构）
**Testing**: 无（MVP 阶段类型检查 + lint 通过即可）
**Target Platform**: Web（移动端 + PC 端浏览器）
**Project Type**: Web application（Next.js 单一代码库）
**Performance Goals**: N/A
**Constraints**: 不改动登录页和鉴权逻辑
**Scale/Scope**: 4 个组件重构 + 2 个布局文件 + 1 个 CSS 变量文件

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| 原则 | 状态 | 说明 |
|------|------|------|
| I. MVP 优先交付 | PASS | 重构页面框架是所有后续页面的基础，属于核心路径 |
| II. 核心路径正确性 | PASS | 严格按照 Stitch 设计规范实现，与 PRD 设计一致 |
| III. 最小抽象 | PASS | 导航项配置直接内联在组件中，不做过度抽取 |
| IV. 实用技术栈 | PASS | 使用项目已确定的技术栈（shadcn/ui、lucide-react、Tailwind） |
| 垂直切片 | PASS | 一次重构一个端（PC → 移动），每端全栈贯通 |
| 中文界面 | PASS | 所有面向用户文本使用中文 |

## Project Structure

### Documentation (this feature)

```text
specs/003-stitch-layout-refactor/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
└── quickstart.md        # Phase 1 output
```

### Source Code (repository root)

```text
app/
├── globals.css                         # 修改：添加 Stitch 色彩 token CSS 变量
├── mobile/
│   └── layout.tsx                      # 修改：重构移动端布局
└── dashboard/
    └── layout.tsx                      # 修改：重构PC端布局

components/
├── dashboard-side-nav.tsx              # 重写：侧边栏组件
├── dashboard-top-bar.tsx               # 重写：顶栏组件（面包屑+用户信息）
├── mobile-top-bar.tsx                  # 重写：移动端顶栏
└── mobile-side-drawer.tsx              # 重写：移动端侧边抽屉
```

**Structure Decision**: 单一 Next.js 项目，保持现有 app/ 路由结构不变，仅重构 components/ 中的 4 个框架组件和 2 个 layout 文件，以及 globals.css 中的色彩变量。

## Complexity Tracking

无宪法违规，不需要记录。
