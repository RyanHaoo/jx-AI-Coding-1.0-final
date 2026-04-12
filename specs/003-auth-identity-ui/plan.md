# Implementation Plan: 登录与身份系统 — 界面与交互层

**Branch**: `002-auth-identity-system` | **Date**: 2026-04-12 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-auth-identity-ui/spec.md`

## Summary

实现第二阶段的 UI 和交互层：严格按照 Stitch 设计系统重构登录页、实现 Supabase Auth 登录（工号→email 映射）、身份选择弹框（登录+切换共用）、鉴权代理（proxy.ts）、导航用户模块（退出+切换身份）。会话状态使用 httpOnly cookie 存储，切换身份后整页刷新。

## Technical Context

**Language/Version**: TypeScript 5.x
**Primary Dependencies**: Next.js 16.2.3 (App Router), React 19.2, @supabase/supabase-js, @supabase/ssr, shadcn/ui 4.2, lucide-react 1.8, Tailwind CSS 4
**Storage**: Supabase Postgres (已有 profiles/projects/user_roles 表), httpOnly cookie (身份选择状态)
**Testing**: MVP 阶段不写测试，tsc --noEmit + biome check 通过即可
**Target Platform**: Web (移动端响应式 + PC 端)
**Project Type**: Web application (Next.js 单一代码库)
**Performance Goals**: 登录 3 秒内完成跳转
**Constraints**: Supabase Auth 使用 email+password，需工号→email 映射; Next.js 16 使用 proxy.ts 替代 middleware.ts
**Scale/Scope**: MVP 演示，3 个测试用户，2 个项目

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| 原则 | 状态 | 说明 |
|------|------|------|
| I. MVP 优先 | ✅ | 只实现核心登录流程和身份选择，不做额外功能 |
| II. 核心路径正确性 | ✅ | 登录→身份选择→鉴权守卫严格匹配 PRD |
| III. 最小抽象 | ✅ | Supabase 客户端直接调用，不包装额外 hook；身份弹框为单一组件非抽象层 |
| IV. 实用技术栈 | ✅ | 使用 PRD 指定的 Supabase Auth + shadcn/ui + Next.js |

## Project Structure

### Documentation (this feature)

```text
specs/003-auth-identity-ui/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── routes.md        # API routes contract
└── checklists/
    └── requirements.md  # Spec quality checklist
```

### Source Code (repository root)

```text
app/
├── layout.tsx                    # 根布局（需增加 Supabase Provider 或保留原样）
├── page.tsx                      # 首页（保持不变）
├── globals.css                   # 全局样式（需更新 CSS 变量匹配 ConstructIntel Pro）
├── login/
│   ├── page.tsx                  # 登录页（重构，严格匹配 Stitch 设计）
│   └── actions.ts                # Server Action: login, lookupEmail
├── auth/
│   └── signout/
│       └── route.ts               # Route Handler: POST signout
├── mobile/
│   ├── layout.tsx                # 移动端布局（需注入用户信息）
│   └── ...
└── dashboard/
    ├── layout.tsx                # PC 端布局（需注入用户信息+管理员检查）
    └── ...

components/
├── ui/                           # shadcn/ui 组件（已有 + 新增 Dialog）
├── identity-dialog.tsx           # 身份选择弹框（共用组件）
├── user-avatar-chip.tsx          # 用户小组件（移动端完整版）
├── mobile-side-drawer.tsx        # 移动端侧边目录（增加用户信息+退出+切换）
├── dashboard-top-bar.tsx         # PC 端顶栏（增加用户下拉菜单）
└── dashboard-side-nav.tsx        # PC 端侧边导航（保持不变）

lib/
├── supabase/
│   ├── client.ts                 # 浏览器端 Supabase 客户端
│   ├── server.ts                 # 服务端 Supabase 客户端
│   └── proxy.ts                  # Proxy 会话刷新+鉴权逻辑
├── utils.ts                      # cn() 工具函数（保持不变）
├── types.ts                      # 全局类型（保持不变）
└── auth.ts                       # 身份相关工具函数（读写 cookie、查询身份）

proxy.ts                          # Next.js 16 proxy 入口（替代 middleware.ts）
```

**Structure Decision**: 单一项目结构（Next.js App Router），所有代码在项目根目录。新增 `lib/supabase/` 目录和 `lib/auth.ts` 工具文件。登录页重构 + 新增 Server Actions。身份弹框为共用组件。

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|--------------------------------------|
| 新增 @supabase/ssr 依赖 | Supabase Auth SSR 集成必须使用此包处理 cookie | 直接操作 cookie 太脆弱，官方推荐此方式 |