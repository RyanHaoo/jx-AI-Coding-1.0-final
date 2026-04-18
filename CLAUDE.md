# CLAUDE.md

本文件为 Claude Code (claude.ai/code) 在本仓库中工作时提供指导。

**重要：始终使用中文进行对话交互。**

## 项目概述

**建筑施工质检情报员** — 面向建筑施工场景的 AI 驱动工单管理系统。单一 Next.js 代码库同时承载移动端（质检员/施工方）和 PC 端（管理员）前端及后端 API。

## 常用命令

```bash
npm run dev        # 启动开发服务器 (localhost:3000)
npm run build      # 生产构建
npm run lint       # Biome 检查
npm run format     # Biome 格式化并写入
npx tsc --noEmit   # 仅类型检查，不输出
```

## 项目结构

```
app/
├── api/
│   └── tickets/
│       ├── route.ts              # 工单列表/创建 API（GET/POST）
│       └── [id]/
│           ├── route.ts          # 工单详情/编辑 API（GET/PATCH）
│           └── actions/
│               ├── resolve/route.ts
│               ├── reject/route.ts
│               └── reopen/route.ts
├── auth/
│   └── select-identity/route.ts  # 登录后身份选择 API
├── layout.tsx                    # 根布局（Geist 字体、zh-CN、metadata）
├── page.tsx                      # 首页（双端入口按钮）
├── globals.css                   # 全局样式（Stitch + shadcn/ui CSS 变量）
├── login/
│   ├── actions.ts                # 登录与身份选择 Server Actions
│   └── page.tsx                  # 登录页（工号/密码 + redirect 校验）
├── mobile/
│   ├── layout.tsx                # 移动端共享布局（顶栏 + 侧边抽屉 + 身份入口）
│   ├── assistant/page.tsx        # 智能助手（阶段 5 待实现）
│   └── tickets/
│       ├── page.tsx              # 工单列表（真实数据加载 + 列表渲染）
│       └── [id]/page.tsx         # 工单详情（真实数据 + 编辑/状态操作）
└── dashboard/
    ├── layout.tsx                # PC 端共享布局（顶栏 + 左侧导航）
    ├── overview/page.tsx         # 数据大盘（阶段 6 待实现）
    ├── tickets/page.tsx          # 工单中心（阶段 6 待实现）
    └── knowledge/page.tsx        # 知识运营（阶段 6 待实现）

components/
├── ui/                           # shadcn/ui 组件（button, input, label, sheet, badge, select）
├── ticket-detail.tsx             # 工单详情组件（展示/编辑双模式）
├── ticket-actions.tsx            # 工单状态机动作按钮（解决/拒绝/重开）
├── project-chip.tsx              # 项目展示小组件（项目名 + 客户名）
├── identity-dialog.tsx           # 身份选择弹框
├── user-avatar-chip.tsx          # 用户展示小组件（部门 + 姓名）
├── mobile-top-bar.tsx            # 移动端顶栏（汉堡菜单 + 标题）
├── mobile-side-drawer.tsx        # 移动端侧边目录（Sheet 从左侧滑入）
├── dashboard-top-bar.tsx         # PC 端顶栏（标题 + 用户区域占位）
└── dashboard-side-nav.tsx        # PC 端侧边导航（3 个菜单项 + 高亮）

lib/
├── auth.ts                       # 身份 cookie 读写、身份列表查询
├── auth-actions.ts               # 身份切换 Server Action
├── tickets.ts                    # 工单数据访问层（含关联查询）
├── supabase/                     # client/server/proxy 三端 Supabase 客户端
├── utils.ts                      # cn() 工具函数
└── types.ts                      # 全局类型（角色、工单、项目等）
```

## 架构

**Next.js 16 (App Router)** 单一代码库，前后端统一。

### 路由结构

```
/                          → 首页（移动端入口 + PC 后台入口）
/login                     → 统一登录页（支持 ?redirect= 回跳）
/mobile/assistant          → Agent 对话（知识检索 + 创建工单）
/mobile/tickets            → 工单列表（Tab 筛选）
/mobile/tickets/:id        → 工单详情
/dashboard/overview        → 数据大盘
/dashboard/tickets         → 工单中心（表格 + 右侧详情抽屉）
/dashboard/knowledge       → 知识运营（候选池 + QA 对列表）
```

### 技术栈

| 层次 | 技术选型 |
|------|----------|
| 框架 | Next.js 16 App Router (RSC + Server Actions) |
| 数据库与鉴权 | Supabase (Postgres + Auth + RLS) |
| AI Agent | LangChain `createAgent`，LangSmith 监控 |
| 知识 Agent | 扣子（Coze）平台外部 API |
| AI 总结 | Kimi API（单轮后端调用） |
| 流式响应 | LangChain `useStream` 处理 SSE |
| UI | Tailwind + shadcn/ui + lucide-react |
| 代码检查 | Biome（不是 ESLint） |
| 部署 | Vercel |

### 核心数据实体

- `profiles` — 用户业务信息（关联 Supabase Auth）
- `projects` — 施工项目
- `user_roles` — 用户 × 项目 × 角色三元组（质检员/施工方/管理员）
- `tickets` — 工单（状态：待处理/已完成/已拒绝）
- `ticket_logs` — 工单全生命周期变更记录（本阶段暂未实现）

工单写入**必须**经过 Next.js 后端 API，不可直接调用 Supabase Auto API，因为需要状态机校验与权限控制。

### 工单状态机

`待处理 → 已完成`（解决）或 `待处理 → 已拒绝`（拒绝）。已关闭工单可重新打开。状态转换受角色权限控制（详见 `doc/工单状态机.md`）。本阶段按 spec 跳过 `ticket_logs` 写入。

## Next.js 16 重要变更

本项目使用 Next.js 16，API 与训练数据可能存在显著差异：

- **Middleware 已更名为 Proxy**：使用 `proxy.ts`（而非 `middleware.ts`），导出 `proxy` 函数或默认导出，`config.matcher` 用法不变
- **动态路由 params 是 Promise**：在 Server Component / Route Handler 中使用 `await params` 解包，不要用条件判断绕过
- **useSearchParams 必须包 Suspense**：否则 SSG prerender 报错
- **不确定的 API 先查文档**：使用任何 Next.js API 前，先阅读 `node_modules/next/dist/docs/` 下的对应文档
- 默认使用 Server Components，仅在需要交互时添加 `'use client'`

## 开发流程经验

- 批量创建/修改文件后，先跑 `npm run format` + `npm run lint`，再跑 `tsc --noEmit`，最后再提交
- 局部修改文件后提交前，跑一遍 `npm run lint` 确认通过

## 开发原则（源自 `.specify/memory/constitution.md`）

1. **MVP 优先** — 先跑通核心路径，跳过边界情况和非阻塞问题，不考虑性能指标和优化
2. **核心路径正确性** — 流程必须严格匹配 PRD
3. **最小抽象** — 不做推测性抽象和防御性编程。单次使用的代码直接内联；3 处以上使用再抽取
4. **不写测试除非被要求** — MVP 阶段类型检查 + lint 通过即可
5. **垂直切片** — 一次实现一个用户故事的全栈贯通
6. **中文界面，英文代码** — 面向用户的文本使用中文；变量名和注释使用英文

## 产品规格文档

所有产品规格位于 `doc/` 目录：
- `doc/项目总览.md` — 项目总览
- `doc/数据定义.md` — 实体定义与数据库表结构
- `doc/工单状态机.md` — 工单状态机
- `doc/核心组件/` — 共享组件规格（工单详情、用户导航）
- `doc/移动端/` — 移动端页面规格
- `doc/PC端/` — PC 端页面规格
- `doc/Agent模块/` — Agent 架构、系统提示词、MCP/HITL 工具定义

开发阶段进度跟踪见 `progress.md`。

## Git 卡控

使用 Husky pre-commit hook（`.husky/pre-commit`），每次 `git commit` 前自动运行：
1. `npx tsc --noEmit` — TypeScript 类型检查
2. `npx biome check` — Biome lint 检查

任一检查失败，提交会被阻止。不要使用 `--no-verify` 跳过卡控。

## 约定

- 路径别名：`@/*` 映射到项目根目录
- shadcn/ui 样式：`radix-nova`，基础色 neutral，启用 CSS 变量
- UI 风格遵循 Stitch 设计系统，详见 **[DESIGN.md](./DESIGN.md)**（色彩 token、布局规范、视觉规则、图标映射）
- 工单 ID 为自增 INT（即工单编号）

## Stitch MCP 项目 ID

- Stitch 项目 ID：`16591807519307787618`

## Active Technologies
- TypeScript 5.x, Next.js 16.2.3 (App Router) + React 19.2, shadcn/ui 4.2, lucide-react 1.8, Tailwind CSS 4, Biome 2.2 (001-project-init)
- N/A（本阶段不涉及数据库） (001-project-init)
- TypeScript 5.x / PostgreSQL 15 (Supabase) + Next.js 16.2.3 (App Router), Supabase (Auth + Database + RLS) (002-auth-identity-system)
- Supabase Postgres (002-auth-identity-system)
- TypeScript 5.x + Next.js 16.2.3 (App Router), React 19.2, @supabase/supabase-js, @supabase/ssr, shadcn/ui 4.2, lucide-react 1.8, Tailwind CSS 4 (002-auth-identity-system)
- Supabase Postgres (已有 profiles/projects/user_roles 表), httpOnly cookie (身份选择状态) (002-auth-identity-system)
- Stitch 设计系统 CSS 变量 (--stitch-*)，lucide-react 图标导航 (003-stitch-layout-refactor)
- TypeScript 5.x + Next.js 16.2.3 (App Router) + React 19.2 + @supabase/ssr + @supabase/supabase-js + shadcn/ui 4.2 + Radix UI + Tailwind CSS 4 + lucide-react (004-ticket-component-actions)
- Supabase Postgres（已有 profiles/projects/user_roles 三张表，需新增 tickets 表） (004-ticket-component-actions)
- TypeScript 5.x + Next.js 16.2.3 (App Router), React 19.2, @supabase/ssr, @supabase/supabase-js, shadcn/ui 4.2（Badge/Button/Sheet/Tabs/Input/Select）, lucide-react 1.8, Tailwind CSS 4 (005-mobile-ticket-detail)
- Supabase Postgres（已存在 `tickets`/`profiles`/`projects`/`user_roles` 表；本阶段不新增表结构） (005-mobile-ticket-detail)

## Recent Changes
- 001-project-init: Added TypeScript 5.x, Next.js 16.2.3 (App Router) + React 19.2, shadcn/ui 4.2, lucide-react 1.8, Tailwind CSS 4, Biome 2.2
