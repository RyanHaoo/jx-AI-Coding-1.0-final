# Implementation Plan: 移动端工单界面（列表 + 详情组件接入）

**Branch**: `005-mobile-ticket-detail` | **Date**: 2026-04-18 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/005-mobile-ticket-detail/spec.md`

## Summary

把 004 中完成的 `TicketDetail` 组件、工单后端 API 组装成完整的移动端工单用户旅程：重做 `/mobile/tickets` 列表页（卡片化、Tab 状态筛选、紧急置顶、加载/空/错误态、图片预览），在 `/mobile/tickets/:id` 顶栏添加返回按钮与"工单详情"标题，并完善未登录重定向与无权访问提示。所有技术选型沿用现有栈（Next.js 16 App Router RSC + Client Components、Supabase、shadcn/ui、Tailwind），不引入新依赖。

## Technical Context

**Language/Version**: TypeScript 5.x  
**Primary Dependencies**: Next.js 16.2.3 (App Router), React 19.2, @supabase/ssr, @supabase/supabase-js, shadcn/ui 4.2（Badge/Button/Sheet/Tabs/Input/Select）, lucide-react 1.8, Tailwind CSS 4  
**Storage**: Supabase Postgres（已存在 `tickets`/`profiles`/`projects`/`user_roles` 表；本阶段不新增表结构）  
**Testing**: 不写测试（宪法 I）；只运行 `npx tsc --noEmit` + `npm run lint`  
**Target Platform**: 移动端浏览器（窄屏优先，通过 Next.js SSR + Tailwind 响应式实现）  
**Project Type**: Web application — Next.js 单一代码库（前后端一体）  
**Performance Goals**: 无严格指标；Tab 切换需可感知即时响应（MVP，宪法 I）  
**Constraints**: 列表不分页，`limit 50` 拉取（spec Assumptions）；工单写入必须走 Next.js API（CLAUDE.md 架构约束）  
**Scale/Scope**: 单项目工单量 < 50 条（种子数据量级）；影响 3 个路由文件 + 1 个布局客户端文件 + 新增 1 个列表卡片组件

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

对照 `.specify/memory/constitution.md`：

| 原则 | 适用性 | 本计划的对应做法 |
|------|--------|------------------|
| I. MVP 优先交付 | ✅ 通过 | 只实现 spec 中的 P1–P5 用户故事；跳过分页、实时推送、编辑离开确认、图片真实上传；不写测试 |
| II. 核心路径正确性 | ✅ 通过 | 列表/详情的字段、Tab 分类、紧急置顶规则严格按 `doc/移动端/工单列表页.md`；详情字段与按钮沿用 004（已对齐状态机文档） |
| III. 最小抽象 | ✅ 通过 | 新增的列表卡片组件仅在列表页一处使用；Tab 过滤用 `useMemo` 本地过滤，不抽 hook；不引入新依赖、不做可扩展设计 |
| IV. 实用技术栈 | ✅ 通过 | 仅使用既有技术栈；Tabs 使用 shadcn/ui（若未安装需通过 `npx shadcn@latest add tabs` 引入，属于 PRD 指定栈内） |

**Gate 结果**：无违规，可进入 Phase 0。

## Project Structure

### Documentation (this feature)

```text
specs/005-mobile-ticket-detail/
├── plan.md              # 本文件
├── research.md          # Phase 0 输出
├── data-model.md        # Phase 1 输出（仅引用既有实体）
├── quickstart.md        # Phase 1 输出（本地验收步骤）
├── contracts/
│   └── mobile-ui.md     # 移动端 UI 契约（路由 + 组件 props + 交互约定）
└── checklists/
    └── requirements.md  # spec 质量 checklist（已有）
```

### Source Code (repository root)

```text
app/
├── mobile/
│   ├── layout.tsx                     # [修改] 把 pathname → title 映射覆盖 "/mobile/tickets/:id" → "工单详情"；当 pathname 匹配详情页时显示返回按钮
│   └── tickets/
│       ├── page.tsx                   # [重写] 从当前极简版升级为完整列表：Tab + 卡片 + 紧急置顶 + 状态/空/错
│       ├── loading.tsx                # [新增] 列表骨架屏
│       └── [id]/
│           ├── page.tsx               # [微调] 保持既有 RSC 实现；必要时用 `notFound()` 保留 404
│           └── loading.tsx            # [新增] 详情骨架屏

components/
├── mobile-layout-client.tsx           # [修改] 支持在详情路由下渲染返回按钮（替代汉堡菜单 or 左侧加一个返回）并切换标题
├── mobile-top-bar.tsx                 # [修改] 新增可选 `showBack` / `onBack` props
├── ticket-list-item.tsx               # [新增] 工单列表卡片组件（限本列表页使用，因此放在顶级 components 仍可接受）
└── ui/tabs.tsx                        # [新增（若缺）] 通过 `npx shadcn@latest add tabs` 引入

app/api/tickets/                       # 无改动（GET 列表、GET/PATCH 详情均已满足需求）
lib/tickets.ts                         # 无改动
lib/auth.ts                            # 无改动
proxy.ts                               # 无改动（已覆盖 /mobile/* 的未登录重定向）
```

**Structure Decision**: 本项目是 Next.js 单仓库 web application（CLAUDE.md 已声明）。本 spec 不新增后端路由，仅调整前端路由与组件；所有文件归属既有目录结构，不引入新目录层级。

## Complexity Tracking

> 无需填写 — Constitution Check 全部通过，不存在需要论证的违规。
