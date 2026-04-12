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
- `ticket_logs` — 工单全生命周期变更记录

工单写入**必须**经过 Next.js 后端 API，不可直接调用 Supabase Auto API，因为需要状态机校验和自动创建变更记录。

### 工单状态机

`待处理 → 已完成`（解决）或 `待处理 → 已拒绝`（拒绝）。已关闭工单可重新打开。状态转换受角色权限控制（详见 `doc/工单状态机.md`）。每次操作必须创建一条 `ticket_logs` 记录。

## Next.js 16 重要变更

本项目使用 Next.js 16，API 与训练数据可能存在显著差异：

- **Middleware 已更名为 Proxy**：使用 `proxy.ts`（而非 `middleware.ts`），导出 `proxy` 函数或默认导出，`config.matcher` 用法不变
- **不确定的 API 先查文档**：使用任何 Next.js API 前，先阅读 `node_modules/next/dist/docs/` 下的对应文档
- 默认使用 Server Components，仅在需要交互时添加 `'use client'`

## 开发原则（源自 `.specify/memory/constitution.md`）

1. **MVP 优先** — 先跑通核心路径，跳过边界情况和非阻塞问题
2. **核心路径正确性** — 工单流程（质检员创建 → 施工方处理 → 管理员监控 → 知识沉淀）必须严格匹配 PRD
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

## 约定

- 路径别名：`@/*` 映射到项目根目录
- shadcn/ui 样式：`radix-nova`，基础色 neutral，启用 CSS 变量
- UI 风格：简约专业白底浅蓝（Notion 风格），不用渐变/重阴影/发光效果
- 工单 ID 为自增 INT（即工单编号）
