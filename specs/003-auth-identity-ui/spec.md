# Feature Specification: 登录与身份系统 — 界面与交互层

**Feature Branch**: `002-auth-identity-system`
**Created**: 2026-04-12
**Status**: Draft
**Input**: User description: "严格按照 Stitch MCP 里的登录页面样式完成第二阶段后续开发"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 用户通过工号密码登录系统 (Priority: P1)

用户在登录页输入工号和密码，点击登录按钮。系统调用 Supabase Auth 验证身份，成功后弹出身份选择弹框（多身份时）或直接进入目标页面（单身份时）。登录失败时显示错误提示。

**Why this priority**: 登录是所有功能的入口，没有登录就无法使用任何业务功能。这是第二阶段最核心的交互。

**Independent Test**: 可以通过登录页输入测试账号的工号和密码，验证登录成功跳转和失败提示，无需依赖其他用户故事。

**Acceptance Scenarios**:

1. **Given** 用户未登录，在登录页，**When** 输入正确工号（如 zhangqc）和密码（test123456）后点击登录，**Then** Supabase Auth 验证通过，弹出身份选择弹框（多身份时）或直接跳转目标页面（单身份时）
2. **Given** 用户未登录，在登录页，**When** 输入错误工号或密码后点击登录，**Then** 页面显示错误提示（如"工号或密码错误"），不清空已输入的工号
3. **Given** 用户未登录，URL 带有 `?redirect=/mobile/tickets` 参数，**When** 登录成功，**Then** 跳转到 `/mobile/tickets` 而非默认页面
4. **Given** 用户未登录，**When** 工号或密码字段为空时点击登录，**Then** 按钮不可点击或显示必填提示
5. **Given** 登录请求正在处理中，**When** 用户再次点击登录按钮，**Then** 按钮处于禁用状态，防止重复提交

---

### User Story 2 - 用户选择项目/角色身份 (Priority: P2)

登录成功后，若用户在多个项目中担任不同角色，系统弹出身份选择弹框，列出所有「项目 + 角色」组合。用户选择其中一个后，系统将选定身份写入会话状态，然后跳转到目标页面。若用户只有一个身份，则跳过选择直接使用。登录后和切换身份时共用同一个身份选择弹框。

**Why this priority**: 身份选择是登录流程的延续，决定了用户后续的数据可见范围和操作权限。多身份场景虽非所有用户都有，但对管理员等角色至关重要。

**Independent Test**: 可以使用有多个身份绑定的测试账号（如管理员 wangguanli 同时在两个项目中）登录，验证身份选择弹框的展示和选择逻辑。

**Acceptance Scenarios**:

1. **Given** 用户登录成功且有 2 个以上身份（如项目A质检员 + 项目B管理员），**When** 登录成功后，**Then** 弹出身份选择弹框，列出所有身份组合，每个选项显示项目名称和角色
2. **Given** 身份选择弹框已展示，**When** 用户点击某个身份选项，**Then** 弹框关闭，系统将该身份写入会话状态并跳转到目标页面
3. **Given** 用户登录成功且只有 1 个身份，**When** 登录完成后，**Then** 自动使用该身份并直接跳转目标页面，不弹出身份选择弹框
4. **Given** 用户已登录且在系统内（移动端或 PC 端），**When** 点击切换身份，**Then** 弹出与登录时相同的身份选择弹框，列出所有可选身份
5. **Given** 身份选择弹框展示中（切换身份场景），**When** 用户选择新身份，**Then** 弹框关闭，会话状态更新为新身份，整页刷新以加载新身份对应的数据

---

### User Story 3 - 用户通过导航模块管理身份 (Priority: P3)

用户在移动端侧边目录或 PC 端顶栏可以看到当前身份信息（头像、姓名、项目、角色），点击后可退出登录或弹出身份选择弹框切换身份。退出登录后清除会话状态并跳转回登录页。

**Why this priority**: 导航用户模块是持续交互的一部分，确保用户随时可以确认自己的身份状态并执行退出操作。

**Independent Test**: 登录后在移动端或 PC 端布局中验证用户信息展示、切换身份和退出登录功能。

**Acceptance Scenarios**:

1. **Given** 用户已登录并选择了身份，**When** 查看移动端侧边目录底部，**Then** 显示用户头像、部门、姓名和当前项目/角色
2. **Given** 用户已登录并选择了身份，**When** 查看 PC 端顶栏右侧，**Then** 显示用户头像和姓名
3. **Given** 用户已登录，**When** 点击退出登录，**Then** 调用 Supabase Auth 退出，清除会话状态，跳转到 `/login`
4. **Given** 用户已登录，**When** 在移动端或 PC 端点击切换身份，**Then** 弹出身份选择弹框（与登录时相同的弹框），列出所有可选身份
5. **Given** 身份选择弹框展示中（切换身份场景），**When** 用户选择新身份，**Then** 弹框关闭，会话状态更新，整页刷新以加载新身份对应的数据

---

### User Story 4 - 未登录用户被鉴权守卫拦截 (Priority: P2)

未登录用户访问移动端或 PC 端页面时，鉴权中间件自动拦截并重定向到登录页，登录成功后自动跳回原页面。PC 端额外要求管理员角色，非管理员访问 PC 端时显示无权限提示。

**Why this priority**: 鉴权守卫是系统安全的保障，防止未授权访问。与身份选择同为 P2，因为两者共同构成完整的身份体系。

**Independent Test**: 在未登录状态下直接访问 `/mobile/assistant` 或 `/dashboard/overview`，验证重定向行为。

**Acceptance Scenarios**:

1. **Given** 用户未登录，**When** 访问 `/mobile/assistant`，**Then** 重定向到 `/login?redirect=/mobile/assistant`
2. **Given** 用户未登录，**When** 访问 `/dashboard/overview`，**Then** 重定向到 `/login?redirect=/dashboard/overview`
3. **Given** 用户已登录但非管理员角色（如质检员），**When** 访问 `/dashboard/overview`，**Then** 重定向到移动端首页（`/mobile/assistant`）
4. **Given** 用户已登录且是管理员，**When** 访问 `/dashboard/overview`，**Then** 正常显示页面

---

### Edge Cases

- 用户登录后 Supabase session 过期（token 失效）时，操作应触发重新登录流程
- 网络断开时登录请求失败，显示友好的网络错误提示
- 用户在身份选择弹框打开时刷新浏览器，应能恢复到登录状态
- 首页（`/`）不需要登录即可访问
- 用户已有有效 session 时访问 `/login`，应直接跳转到对应端首页

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: 登录页必须严格按照 Stitch 设计系统的"响应式极简版"样式实现，包括：居中卡片布局、architecture 品牌图标、标题"建筑施工质检情报员"、副标题"CONSTRUCTION INTELLIGENCE"、工号输入（badge icon）、密码输入（lock icon）、登录按钮（primary 蓝色 + 箭头图标）、安全提示（verified_user icon）、版权页脚
- **FR-002**: 登录页必须使用 ConstructIntel Pro 设计系统的色彩令牌：背景 `#f7f9fb`、主色 `#005ac2`、输入框背景 `#e8eff3`、文字 `#2a3439`、辅助文字 `#566166`
- **FR-003**: 登录页必须使用 Inter 字体（英文/数字）和 Noto Sans SC（中文），圆角使用 0-0.25rem 极小值，遵循"无边界"规则（用色调偏移区分区域，不用实线边框）
- **FR-004**: 登录页必须对接 Supabase Auth，使用工号查找对应 profile 的 auth email 进行登录验证（因为 Supabase Auth 使用 email 登录，但用户使用工号）
- **FR-005**: 登录失败时必须显示中文错误提示，且不清空已输入的工号字段
- **FR-006**: 登录过程中按钮必须处于禁用状态，防止重复提交
- **FR-007**: 登录成功后必须支持 URL `redirect` 参数跳转回原页面
- **FR-008**: 系统必须提供工号到 email 的查询能力（通过 profiles 表的 number 字段查找关联的 auth email）
- **FR-009**: 登录成功后，若用户有多个身份（user_roles 记录 > 1），必须弹出身份选择弹框，列出所有「项目名称 + 角色名称」组合
- **FR-010**: 身份选择完成后，必须将选定的项目 ID、项目名称、角色写入 httpOnly cookie，服务端和 proxy.ts 可直接解析
- **FR-011**: 若用户只有一个身份，登录后必须自动使用该身份，跳过身份选择弹框
- **FR-012**: 鉴权中间件（proxy.ts）必须拦截未登录用户对 `/mobile/*` 和 `/dashboard/*` 的访问，重定向到 `/login?redirect=<原路径>`
- **FR-013**: PC 端（`/dashboard/*`）额外要求管理员角色，非管理员访问时重定向到移动端首页（`/mobile/assistant`）
- **FR-014**: 移动端侧边目录底部必须展示用户小组件（头像 + 部门 + 姓名 + 当前项目/角色）和退出登录选项
- **FR-015**: PC 端顶栏右侧必须展示用户小组件（头像 + 姓名）和下拉菜单（退出登录）
- **FR-016**: 退出登录必须调用 Supabase Auth 登出接口，清除本地会话状态，跳转到 `/login`
- **FR-017**: 移动端和 PC 端点击切换身份时，必须弹出与登录时相同的身份选择弹框，用户选择新身份后直接切换，无需退出登录
- **FR-018**: 切换身份后，会话状态必须立即更新为新身份，整页刷新（`router.refresh()`）以重新获取服务端数据，确保数据可见范围与新身份一致
- **FR-019**: 首页（`/`）和登录页（`/login`）不需要鉴权，可匿名访问

### Key Entities

- **Session State（会话状态）**: 存储当前用户的选定身份信息，包括项目 ID、项目名称、角色。通过 httpOnly cookie 存储，服务端和 proxy.ts 可直接解析读取。
- **Identity Option（身份选项）**: 用户可选的身份组合，包含项目名称、角色名称、项目 ID。来自 user_roles 表的查询结果。
- **Identity Selection Dialog（身份选择弹框）**: 通用弹框组件，登录后（多身份时）和切换身份时共用。列出所有可选身份，用户点击即可选择。
- **User Widget（用户小组件）**: 展示当前用户信息的 UI 组件，移动端展示头像+部门+姓名+身份，PC 端展示头像+姓名。

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 用户在登录页输入正确工号和密码后，3 秒内完成登录并跳转到目标页面
- **SC-002**: 登录页视觉样式与 Stitch 原型"响应式极简版"一致，包括布局、色彩、字体、图标、间距
- **SC-003**: 未登录用户访问受保护页面时，100% 被重定向到登录页，登录后自动跳回原页面
- **SC-004**: 拥有多个身份的用户登录后能看到所有可选身份，选择后正确切换数据可见范围
- **SC-005**: 退出登录后所有会话状态被清除，无法再访问受保护页面

## Clarifications

### Session 2026-04-12

- Q: 非管理员角色访问 PC 端时如何处理？ → A: 重定向到移动端首页（`/mobile/assistant`）
- Q: 切换身份后页面如何刷新？ → A: 整页刷新（`router.refresh()`），服务端组件重新获取数据
- Q: 会话状态使用什么方式存储？ → A: Cookie（httpOnly，服务端可读，proxy.ts 直接解析）

## Assumptions

- Supabase 项目已配置完成，Auth 和数据库表已在阶段 2 数据层中创建完毕
- 种子数据（3 个测试用户、2 个项目、5 个角色绑定）已就绪
- Supabase Auth 使用 email + password 认证，用户在登录页输入工号，系统通过 profiles 表查询工号对应的 email 进行认证
- 会话状态使用 httpOnly cookie 存储（服务端设置，服务端可读），包含项目 ID、项目名称、角色信息，proxy.ts 可直接解析做鉴权判断
- 身份选择使用弹框形式，不作为独立页面。登录后（多身份时）和切换身份时共用同一个身份选择弹框组件
- 切换身份直接在线完成（选择新身份 → 更新会话状态 → 整页刷新），无需退出登录
- Next.js 16 使用 proxy.ts（而非 middleware.ts）进行鉴权拦截
- 移动端布局（侧边目录）和 PC 端布局（顶栏+侧边导航）已在阶段 1 搭建完成，本阶段需要补充用户信息和退出功能
- 设计系统色彩令牌已在 globals.css 中通过 CSS 变量定义，与 ConstructIntel Pro 设计系统对齐
- 登录页需要同时支持移动端和 PC 端的响应式展示（Stitch 原型为响应式极简版）
