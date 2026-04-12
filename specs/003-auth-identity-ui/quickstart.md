# Quickstart: 登录与身份系统 — 界面与交互层

**Feature**: 003-auth-identity-ui | **Date**: 2026-04-12

## Prerequisites

- Node.js 24+ (LTS)
- Supabase 项目已配置（阶段 2 已完成）
- 环境变量已设置

## Environment Setup

### 1. 安装依赖

```bash
npm install @supabase/supabase-js @supabase/ssr
```

### 2. 配置环境变量

在 `.env.local` 中添加：

```bash
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-project-url>
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<your-supabase-publishable-key>
```

获取方式：
- URL: Supabase Dashboard → Settings → API → Project URL
- Key: Supabase Dashboard → Settings → API → Publishable Key (或 Anon Key)

### 3. 验证种子数据

确认以下测试数据存在：

| 工号 | Email | 角色 | 项目 |
|------|-------|------|------|
| zhangqc | zhangqc@test.com | 质检员 | 翡翠湾花园 |
| lishigong | lishigong@test.com | 施工方 | 翡翠湾花园 |
| wangguanli | wangguanli@test.com | 管理员 | 翡翠湾花园 + 星河产业园 |

密码均为: `test123456`

## Development

### 启动开发服务器

```bash
npm run dev
```

### 测试流程

1. **登录测试**: 访问 `/login`，输入工号 `zhangqc` + 密码 `test123456`
2. **多身份测试**: 用 `wangguanli` 登录，应弹出身份选择弹框
3. **鉴权测试**: 未登录状态访问 `/mobile/assistant`，应重定向到登录页
4. **PC 端权限测试**: 用质检员登录后访问 `/dashboard/overview`，应重定向到移动端
5. **切换身份测试**: 登录后点击切换身份，弹框选择新身份，页面刷新

### 代码检查

```bash
npm run format    # 格式化
npm run lint      # Biome 检查
npx tsc --noEmit  # 类型检查
```

## Key Files

| 文件 | 用途 |
|------|------|
| `lib/supabase/client.ts` | 浏览器端 Supabase 客户端 |
| `lib/supabase/server.ts` | 服务端 Supabase 客户端 |
| `lib/supabase/proxy.ts` | Proxy 会话刷新逻辑 |
| `lib/auth.ts` | 身份 cookie 工具函数 |
| `proxy.ts` | Next.js 16 proxy 入口 |
| `app/login/page.tsx` | 登录页 UI |
| `app/login/actions.ts` | 登录 Server Actions |
| `app/auth/signout/route.ts` | 登出 Route Handler |
| `components/identity-dialog.tsx` | 身份选择弹框 |
| `components/user-avatar-chip.tsx` | 用户小组件 |