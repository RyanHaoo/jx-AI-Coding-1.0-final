# Research: 登录与身份系统 — 界面与交互层

**Feature**: 003-auth-identity-ui | **Date**: 2026-04-12

## 1. Supabase Auth + Next.js 16 App Router 集成

### Decision: 使用 `@supabase/supabase-js` + `@supabase/ssr`

**Rationale**: `@supabase/ssr` 是官方推荐的 SSR 包，提供 `createBrowserClient` 和 `createServerClient`，自动处理 cookie 读写和 PKCE 流程。旧的 `@supabase/auth-helpers-nextjs` 已废弃。

**Alternatives considered**:
- `@supabase/auth-helpers-nextjs` — 已废弃，不再维护
- 手动管理 cookie — 太脆弱，容易出错，官方不推荐

### 关键 API 选择

| 场景 | 使用方法 | 原因 |
|------|----------|------|
| Proxy 中验证身份 | `supabase.auth.getClaims()` | 轻量，本地验证 JWT 签名，不发网络请求 |
| Server Component/Action 中验证 | `supabase.auth.getUser()` | 向 Auth 服务器验证，保证最新状态 |
| 客户端读取 session | `supabase.auth.getSession()` | 仅客户端使用，不做鉴权 |
| 登录 | `supabase.auth.signInWithPassword()` | 标准 email+password 登录 |
| 登出 | `supabase.auth.signOut()` | 清除 cookie 中的 session |

### 文件结构

```
lib/supabase/
├── client.ts    # createBrowserClient — Client Components 使用
├── server.ts    # createServerClient + cookies() — Server Components/Actions 使用
└── proxy.ts     # updateSession() — Proxy 会话刷新和鉴权
proxy.ts         # Next.js 16 proxy 入口（项目根目录）
```

## 2. 工号到 Email 的映射方案

### Decision: 登录时先查询 profiles 表获取 email，再用 email 登录 Supabase Auth

**Rationale**: Supabase Auth 只支持 email+password 登录，但用户使用工号登录。需要在 Server Action 中先通过工号查询 profiles 表获取关联的 email，再调用 `signInWithPassword`。

**实现流程**:
1. 用户输入工号和密码
2. Server Action 收到工号后，用 service role client 查询 `profiles` 表 `number` 字段
3. 找到对应的 `id`（即 auth.users 的 UUID），再通过 `supabase.auth.admin.getUserById(id)` 获取 email
4. 或更简单：直接用 service role 查询 `profiles WHERE number = ?` 获取 `id`，然后用 `supabase.auth.admin.listUsers()` 或存储 email 在 profiles 表
5. 用获取到的 email + 用户输入的密码调用 `signInWithPassword`

**备选方案（更简洁）**: 在 profiles 表中存储 auth email。种子数据已包含 email（zhangqc@test.com 等），可直接在 profiles 表增加 `auth_email` 字段或直接用 `number` 做查询。但实际上 Supabase Auth 的 `auth.users` 表已经有 email，我们只需要通过 profile 的 `id` 关联到 `auth.users`。

**最终方案**: 使用 Server Action，用 supabase admin client 从 `profiles` 表查 `number` 得到 `id`，再从 `auth.users` 查 `id` 得到 `email`，然后用 `signInWithPassword` 登录。

## 3. 身份选择状态存储

### Decision: httpOnly cookie 存储

**Rationale**: httpOnly cookie 可被 proxy.ts（服务端中间件）直接解析，无需额外 API 调用。Supabase session metadata 需要客户端 SDK 调用，不适合在代理层使用。

**Cookie 内容**:
- `active_project_id`: 当前选中的项目 ID
- `active_project_name`: 当前选中的项目名称（避免每次查库）
- `active_role`: 当前选中的角色

**Cookie 设置**:
- `httpOnly: true` — 防止 XSS 读取
- `secure: true` — HTTPS only
- `path: /` — 全站可用
- `sameSite: 'lax'` — 防止 CSRF
- `maxAge`: 与 Supabase Auth session 同步或较长（如 7 天）

**读写方式**:
- 写入：Server Action 中使用 `cookies().set()`
- 读取：proxy.ts 和 Server Components 中使用 `cookies().get()` / `request.cookies.get()`
- 切换：Server Action 更新 cookie 值 + `revalidatePath`

## 4. Next.js 16 Proxy（替代 Middleware）

### Decision: 使用 `proxy.ts` 替代 `middleware.ts`

**Rationale**: Next.js 16 将 middleware 重命名为 proxy，导出 `proxy` 函数或默认导出。`config.matcher` 用法不变。

**Proxy 职责**:
1. 刷新 Supabase Auth session token
2. 未登录用户访问 `/mobile/*` 或 `/dashboard/*` → 重定向到 `/login?redirect=<原路径>`
3. 已登录但非管理员访问 `/dashboard/*` → 重定向到 `/mobile/assistant`
4. 已登录用户访问 `/login` → 重定向到对应端首页
5. `/` 首页和 `/login` 不需要鉴权

**注意**: Proxy 中使用 `getClaims()` 而非 `getUser()`（轻量，不发网络请求）。Proxy 只做粗粒度的登录检查，角色检查在 Server Component 中用 `getUser()` 精确验证。

## 5. Stitch 设计系统 — ConstructIntel Pro 登录页

### Decision: 严格匹配 Stitch 原型"响应式极简版"设计

**关键设计令牌**:

| 令牌 | 值 | 用途 |
|------|-----|------|
| `--background` | `#f7f9fb` | 页面背景 |
| `--primary` | `#005ac2` | 按钮、链接主色 |
| `--primary-container` | `#d8e2ff` | 输入框聚焦等容器 |
| `--surface-container` | `#e8eff3` | 输入框背景 |
| `--surface-container-lowest` | `#ffffff` | 卡片/表单容器 |
| `--on-surface` | `#2a3439` | 主文字色 |
| `--on-surface-variant` | `#566166` | 辅助文字、placeholder |
| `--outline` | `#717c82` | 边框（极少使用） |
| `--outline-variant` | `#a9b4b9` | 微弱边框 |

**布局特征**:
- 居中卡片，背景 `#f7f9fb`，卡片白色 `#ffffff`
- 顶部 `architecture` 图标 + 标题"建筑施工质检情报员" + 副标题"CONSTRUCTION INTELLIGENCE"
- 工号输入（Badge icon）、密码输入（Lock icon）
- 登录按钮：背景 `#005ac2`，文字 `#f7f7ff`，带 ArrowForward icon
- 安全提示（VerifiedUser icon）+ 版权页脚
- "无边界"规则：用色调偏移区分区域，不用实线边框
- 圆角 0-0.25rem

**字体**: Inter（英文/数字）+ Noto Sans SC（中文）

**图标**: lucide-react 中的对应图标（Badge、Lock、ArrowRight、ShieldCheck、Building2 等）

## 6. 身份选择弹框

### Decision: 使用 shadcn/ui Dialog 组件作为弹框基础

**Rationale**: 项目已使用 shadcn/ui，Dialog 组件符合设计系统的极简风格。"无边界"规则下，弹框使用白色卡片样式，背景遮罩半透明。

**弹框内容**:
- 标题："选择身份"
- 列表：每个身份选项显示项目名称 + 角色标签
- 选项样式：卡片式按钮，hover 时微弱色调变化
- 选中后：关闭弹框 → 更新 cookie → `router.refresh()`

## 7. CSS 变量更新策略

### Decision: 在 globals.css 中更新 CSS 变量以匹配 ConstructIntel Pro 设计系统

**Rationale**: shadcn/ui 使用 CSS 变量作为 design token，当前是默认的 neutral 灰度方案。需要将 primary、background 等变量替换为 ConstructIntel Pro 的值，使所有 shadcn 组件自动继承新设计系统。

**需要更新的变量**:
- `--primary` → `#005ac2` (核心蓝)
- `--primary-foreground` → `#f7f7ff`
- `--background` → `#f7f9fb`
- `--card` → `#ffffff`
- `--input` → 使用无边界样式或 `#e8eff3` 背景
- 其他表面色变量

## 8. Globals.css 字体策略

### Decision: 添加 Noto Sans SC 字体，与 Geist 互补

**Rationale**: Stitch 设计系统要求 Inter（英文）+ Noto Sans SC（中文）。项目当前使用 Geist 字体（shadcn/ui 默认）。由于 Geist 和 Inter 风格接近且 Geist 已经是 next/font 的首选，保留 Geist 作为主字体，添加 Noto Sans SC 作为中文字体后备。

**实现**: 使用 `next/font/google` 加载 Noto Sans SC，在 CSS 变量中设置字体栈。