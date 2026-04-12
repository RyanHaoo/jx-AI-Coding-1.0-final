# Feature Specification: 项目初始化

**Feature Branch**: `001-project-init`
**Created**: 2026-04-12
**Status**: Draft
**Input**: User description: "现在已经完成了项目脚手架，继续完成阶段一开发"

## User Scenarios & Testing

### User Story 1 - 首页双端入口导航 (Priority: P1)

质检员、施工方或管理员打开系统首页（`/`），看到两个清晰的入口按钮——"移动端"和"PC 管理端"。点击"移动端"跳转到 `/mobile/assistant`，点击"PC 管理端"跳转到 `/dashboard/overview`。未登录用户点击入口后被重定向到登录页。

**Why this priority**: 首页是所有用户的起点，双端入口是整个系统的门面和导航枢纽，必须最先就绪。

**Independent Test**: 可通过直接访问 `/` 验证两个按钮存在且链接正确，点击后跳转路径符合预期。

**Acceptance Scenarios**:

1. **Given** 用户访问 `/`, **When** 页面加载完成, **Then** 页面显示"移动端"和"PC 管理端"两个入口按钮
2. **Given** 用户点击"移动端"按钮, **When** 未登录, **Then** 跳转到 `/login?redirect=/mobile/assistant`
3. **Given** 用户点击"PC 管理端"按钮, **When** 未登录, **Then** 跳转到 `/login?redirect=/dashboard/overview`
4. **Given** 用户点击"移动端"按钮, **When** 已登录, **Then** 直接跳转到 `/mobile/assistant`

---

### User Story 2 - 登录页面基础搭建 (Priority: P2)

用户通过统一登录页（`/login`）进入系统。页面包含工号输入框和密码输入框，以及登录按钮。支持 URL 参数 `?redirect=` 回跳到登录前访问的页面。

**Why this priority**: 登录是所有受保护页面的前提，但 P1 的首页入口和路由结构可以先用占位页面验证，登录对接 Supabase Auth 属于阶段二，这里先搭建 UI 壳。

**Independent Test**: 可通过访问 `/login` 验证登录表单渲染正确，redirect 参数能正确回显/回跳。

**Acceptance Scenarios**:

1. **Given** 用户访问 `/login`, **When** 页面加载完成, **Then** 显示工号输入框、密码输入框和登录按钮
2. **Given** 用户从 `/mobile/tickets` 被重定向到 `/login?redirect=/mobile/tickets`, **When** 登录成功后, **Then** 自动跳转到 `/mobile/tickets`
3. **Given** 用户直接访问 `/login`（无 redirect 参数）, **When** 登录成功后, **Then** 跳转到默认页面 `/mobile/assistant`

---

### User Story 3 - 路由结构与占位页面 (Priority: P3)

所有规划中的路由路径已创建，每个路径有对应的占位页面，显示当前页面名称，确保路由可访问、布局结构正确。

**Why this priority**: 路由结构是后续所有开发的基础骨架，需要在阶段一就建立完整，但优先级低于首页和登录页的交互体验。

**Independent Test**: 直接访问每个路由路径，验证页面渲染且布局框架正确。

**Acceptance Scenarios**:

1. **Given** 用户访问 `/mobile/assistant`, **When** 页面加载, **Then** 显示移动端助手占位页面
2. **Given** 用户访问 `/mobile/tickets`, **When** 页面加载, **Then** 显示移动端工单列表占位页面
3. **Given** 用户访问 `/mobile/tickets/1`, **When** 页面加载, **Then** 显示移动端工单详情占位页面
4. **Given** 用户访问 `/dashboard/overview`, **When** 页面加载, **Then** 显示数据大盘占位页面
5. **Given** 用户访问 `/dashboard/tickets`, **When** 页面加载, **Then** 显示工单中心占位页面
6. **Given** 用户访问 `/dashboard/knowledge`, **When** 页面加载, **Then** 显示知识运营占位页面

### Edge Cases

- 首页在移动端和 PC 端的布局是否需要自适应？默认按移动端优先，PC 端按钮横排即可
- 登录页收到非法 redirect 参数（如外部域名）时如何处理？应只允许站内路径，防止开放重定向攻击
- 路由路径中的动态参数（如 `/mobile/tickets/:id`）在占位页面阶段如何处理？使用动态路由文件夹

## Requirements

### Functional Requirements

- **FR-001**: 系统必须提供首页（`/`），包含"移动端"和"PC 管理端"两个入口按钮，分别链接到 `/mobile/assistant` 和 `/dashboard/overview`
- **FR-002**: 首页入口按钮必须在移动端和 PC 端均可正常显示和操作
- **FR-003**: 系统必须提供统一登录页（`/login`），包含工号和密码输入框以及登录按钮
- **FR-004**: 登录页必须支持 `redirect` URL 参数，登录成功后自动跳转到指定页面
- **FR-005**: 登录页必须验证 redirect 参数仅允许站内路径，防止开放重定向攻击
- **FR-006**: 系统必须建立完整的路由结构：`/`、`/login`、`/mobile/assistant`、`/mobile/tickets`、`/mobile/tickets/[id]`、`/dashboard/overview`、`/dashboard/tickets`、`/dashboard/knowledge`
- **FR-007**: 每个路由必须渲染对应的占位页面，显示当前页面名称，确保路由可达
- **FR-008**: 系统必须定义全局类型定义文件，包含用户（Profile）、项目（Project）、用户角色（UserRole）、工单（Ticket）、工单变更记录（TicketLog）的 TypeScript 接口与枚举
- **FR-009**: 移动端页面必须共享统一的移动端布局（顶栏 + 内容区），PC 端页面必须共享统一的 PC 端布局（侧边导航 + 内容区）
- **FR-010**: 全局类型必须与数据定义文档中定义的实体字段严格对应

### Key Entities

- **用户 Profile**: id (UUID), number (工号), name (姓名), department (部门), avatar_url (头像链接)
- **项目 Project**: id (自增INT), name (项目名称), city (城市), client_name (客户公司), type (项目类型枚举)
- **用户身份 UserRole**: id (自增INT), user_id (用户外键), project_id (项目外键), role (角色枚举: 质检员/施工方/管理员)
- **工单 Ticket**: id (自增INT), status (状态枚举), severity (严重程度枚举), created_at, creator_id, project_id, assignee_id, specialty_type (专业枚举), description, location, images, detail, root_cause, prevention, knowledge_base
- **工单变更记录 TicketLog**: id (自增INT), ticket_id, operator_id, action (操作枚举), field_diff (JSONB), note, created_at

## Success Criteria

### Measurable Outcomes

- **SC-001**: 用户访问首页后可在 3 秒内识别并点击目标端入口按钮
- **SC-002**: 所有 7 个路由路径均可直接访问并正确渲染对应页面内容
- **SC-003**: 登录页表单在提交时可正确校验工号和密码非空，并支持 redirect 回跳
- **SC-004**: 全局类型文件通过 TypeScript 编译检查，无类型错误
- **SC-005**: 移动端布局和 PC 端布局在不同屏幕尺寸下不出现布局错乱
- **SC-006**: 项目通过构建编译无错误

## Assumptions

- 登录页在本阶段仅搭建 UI 壳，不对接 Supabase Auth（认证对接属于阶段二）
- 登录按钮点击后暂不做实际认证，仅验证 redirect 参数逻辑
- 占位页面使用简单文本展示页面名称，不做复杂 UI
- 首页的"移动端"/"PC 管理端"入口为简化实现，后续阶段可能根据认证状态动态调整跳转逻辑
- 全局类型定义为纯 TypeScript interface/enum，不依赖 Supabase 生成的类型
- UI 风格遵循简约专业白底浅蓝（Notion 风格），使用 shadcn/ui 和 lucide-react
- 路由守卫（鉴权中间件）属于阶段二，本阶段不实现
