# Research: 项目初始化

**Branch**: `001-project-init` | **Date**: 2026-04-12

## Research Items

### 1. Next.js 16 App Router 嵌套布局模式

**Decision**: 使用 Next.js App Router 原生嵌套布局，`/mobile/` 和 `/dashboard/` 各自拥有 `layout.tsx`，自动继承根布局。

**Rationale**: App Router 的 `layout.tsx` 天然支持嵌套，子路由自动继承父布局，无需额外路由库。移动端和 PC 端布局差异通过各自文件夹下的 `layout.tsx` 隔离。

**Alternatives considered**:
- 单一布局 + 条件渲染：增加了布局组件复杂度，不利于维护
- 自定义路由系统：违背 Next.js 约定，增加不必要的复杂度

### 2. 移动端侧边目录实现方案

**Decision**: 使用 shadcn/ui 的 Sheet 组件作为侧边抽屉，从左侧滑入。

**Rationale**: Sheet 组件基于 Radix UI Dialog，自带蒙层、焦点管理和动画，符合 PRD 中"从左侧滑入"的交互要求。shadcn/ui 已在项目依赖中。

**Alternatives considered**:
- 自定义 CSS 动画抽屉：需要手动处理蒙层、焦点锁定和键盘交互
- 第三方移动端 UI 库：违反"实用技术栈"原则，PRD 指定 shadcn/ui

### 3. 全局类型定义组织方式

**Decision**: 在 `lib/types.ts` 中集中定义所有 TypeScript 接口和枚举，通过 `@/lib/types` 路径别名引用。

**Rationale**: MVP 阶段类型数量有限（5 个实体 + 若干枚举），单文件足以。符合"最小抽象"原则——不到 3 处使用不拆分。若后续类型增长再拆分。

**Alternatives considered**:
- 按实体分文件（`lib/types/profile.ts` 等）：过早抽象，当前无必要
- 从 Supabase 生成类型：属于阶段二工作，且 PRD 要求本阶段类型与数据定义文档严格对应

### 4. 首页双端入口组件选择

**Decision**: 使用 shadcn/ui Button + lucide-react 图标，居中布局，两个大按钮竖排（移动端）或横排（PC 端）。

**Rationale**: 简约 Notion 风格，白底浅蓝，不用渐变和重阴影。Button 组件已在 shadcn/ui 中，lucide-react 图标库已在依赖中。使用 `Smartphone` 和 `Monitor` 图标区分移动端/PC 端。

**Alternatives considered**:
- Card 组件作为入口：过重，PRD 要求"两个大按钮"
- 自定义按钮：shadcn/ui Button 已满足需求

### 5. 登录页 redirect 安全处理

**Decision**: 校验 redirect 参数必须以 `/` 开头且不含 `//`（防止协议跳转），校验通过后使用 `router.push(redirect)` 跳转。

**Rationale**: 开放重定向是 OWASP 常见漏洞，简单的前缀校验足以防御。MVP 阶段不需要完整的 URL 白名单。

**Alternatives considered**:
- 完整 URL 白名单：过度工程化，MVP 阶段路由固定
- 不做校验：安全隐患，违反安全原则
