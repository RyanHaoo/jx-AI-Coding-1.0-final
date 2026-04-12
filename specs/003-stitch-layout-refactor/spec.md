# Feature Specification: 重构移动端与PC端通用页面框架

**Feature Branch**: `003-stitch-layout-refactor`
**Created**: 2026-04-12
**Status**: Draft
**Input**: User description: "严格遵守 Stitch MCP（项目id 16591807519307787618）里的页面内容和布局，重构刚刚实现的移动端和PC端两个通用页面框架，忽略登录页面和鉴权逻辑"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - PC端管理员使用侧边栏导航各功能模块 (Priority: P1)

管理员在PC端打开系统后，看到左侧固定的侧边导航栏，包含品牌标识（construction图标+系统名称）和三个导航入口（数据概览、工单中心、知识库）。当前所在页面对应的导航项高亮显示（primary-container背景色）。右侧主区域顶部显示面包屑导航（如"首页 / 数据大盘"）和当前登录用户头像+姓名。主内容区域使用浅色背景承载各页面内容。

**Why this priority**: PC端是管理员的主要工作入口，侧边栏+顶栏框架是所有PC端页面的基础容器，必须优先确保正确。

**Independent Test**: 打开任一PC端页面（如 /dashboard/overview），验证左侧侧边栏（品牌、导航、高亮）和顶栏（面包屑、用户信息）均正确显示，点击各导航项可跳转。

**Acceptance Scenarios**:

1. **Given** 管理员访问 /dashboard/overview, **When** 页面加载完成, **Then** 左侧显示 w-64 固定侧边栏，顶部含 construction 图标和"施工质检情报员"标题，导航中"数据概览"项高亮（primary-container 背景色），右侧顶栏显示面包屑"首页 / 数据大盘"和用户信息
2. **Given** 管理员在侧边栏点击"工单中心", **When** 跳转至 /dashboard/tickets, **Then** "工单中心"导航项高亮，面包屑更新为"首页 / 工单中心"
3. **Given** 管理员在侧边栏点击"知识库", **When** 跳转至 /dashboard/knowledge, **Then** "知识库"导航项高亮，面包屑更新为"首页 / 知识运营"

---

### User Story 2 - 移动端用户使用侧边抽屉导航 (Priority: P2)

移动端用户在页面顶部看到顶栏（含菜单按钮和当前页面标题），点击菜单按钮后从左侧滑出抽屉导航，包含系统名称、两个导航入口（智能助手、工单列表），以及底部用户信息区域。点击导航项后抽屉关闭并跳转。

**Why this priority**: 移动端是质检员/施工方的主要工作入口，侧边抽屉是移动端所有页面的导航基础。

**Independent Test**: 打开任一移动端页面（如 /mobile/assistant），验证顶栏和抽屉导航正确显示，点击菜单可展开抽屉，点击导航项可跳转。

**Acceptance Scenarios**:

1. **Given** 用户访问 /mobile/assistant, **When** 页面加载完成, **Then** 顶栏显示菜单按钮和页面标题，主内容区正常显示
2. **Given** 用户点击顶栏菜单按钮, **When** 抽屉打开, **Then** 左侧滑出 w-64 抽屉，显示当前页面名称（如"智能助手"）为标题和"建筑施工质检情报员"副标题，以及两个导航项和底部用户信息
3. **Given** 抽屉打开, **When** 用户点击"工单列表", **Then** 抽屉关闭并跳转至 /mobile/tickets，"工单列表"导航项高亮

---

### User Story 3 - 页面框架视觉风格符合 Stitch 设计系统 (Priority: P3)

移动端和PC端的页面框架视觉风格严格遵循 Stitch 设计系统定义：使用音调分层法（Tonal Layering）构建层级，不使用实线边框分割大区域，通过背景色色调偏移界定区域；使用设计系统定义的色彩 token（primary #005ac2, background #f7f9fb, surface-container-low #f0f4f7 等）；圆角使用 round-four 风格；导航项使用 lucide-react 图标替代 Material Symbols。

**Why this priority**: 视觉风格一致性是产品质量的基础，但可以在功能框架完成后再精确调整。

**Independent Test**: 对照 Stitch 设计截图，逐项检查侧边栏背景色、导航项高亮样式、顶栏高度和内容、区域分隔方式是否符合设计规范。

**Acceptance Scenarios**:

1. **Given** PC端页面加载完成, **When** 检查侧边栏背景色, **Then** 使用 surface-container-low（#f0f4f7）而非纯白或 zinc 系列
2. **Given** PC端页面加载完成, **When** 检查主内容区背景色, **Then** 使用 surface-container（#e8eff3）而非 zinc-50
3. **Given** 检查区域分隔方式, **When** 侧边栏与主内容区之间, **Then** 使用极淡的 outline 边框而非粗实线

---

### Edge Cases

- 侧边栏导航项匹配子路径时（如 /mobile/tickets/1 应高亮"工单列表"）需要使用 startsWith 匹配
- 移动端抽屉打开时点击遮罩区域应关闭抽屉（shadcn Sheet 组件已内置此行为）
- 用户信息区域当前为占位内容，后续接入真实数据时只需更新数据源

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: PC端侧边栏 MUST 固定在左侧，宽度 256px（w-64），包含品牌区域（图标+系统名称）和三个导航项（数据概览、工单中心、知识库）
- **FR-002**: PC端侧边栏品牌区域 MUST 包含 construction 图标和"施工质检情报员"文字，底部用极淡 outline 边框分隔
- **FR-003**: PC端导航项 MUST 使用图标+文字形式，当前页面导航项高亮（primary-container 背景，on-primary-container 文字），非当前项为 on-surface-variant 文字色
- **FR-004**: PC端顶栏 MUST 高度 64px（h-16），包含面包屑导航（格式："首页 / 当前页名"）和用户头像+姓名
- **FR-005**: PC端主内容区 MUST 使用 surface-container 背景色，内边距 p-6
- **FR-006**: 移动端顶栏 MUST 包含菜单按钮和当前页面标题
- **FR-007**: 移动端侧边抽屉 MUST 从左侧滑出，宽度 256px（w-64），包含动态标题（显示当前页面名称，如"智能助手"或"工单列表"）和固定副标题"建筑施工质检情报员"，以及两个导航项（智能助手、工单列表）
- **FR-008**: 移动端抽屉底部 MUST 显示用户信息区域（头像占位+姓名+角色），与导航区用极淡 outline 边框分隔
- **FR-009**: 移动端导航项 MUST 使用图标+文字形式，当前项高亮样式与PC端一致
- **FR-010**: PC端侧边栏与主内容区间 MUST 使用极淡 outline 边框分隔（非粗实线），遵循"无边界"规则
- **FR-011**: 所有导航图标 MUST 使用 lucide-react 图标库（LayoutDashboard 对应数据概览，ClipboardList 对应工单中心/工单列表，BookOpen 对应知识库，MessageSquare 对应智能助手，Construction 对应品牌图标）
- **FR-012**: 移动端主内容区 MUST 使用 surface-container-lowest 背景，内边距 p-4

### Key Entities

- **PC端布局**: 由侧边栏（品牌区+导航列表）和主区域（顶栏+内容区）组成的固定布局结构
- **移动端布局**: 由顶栏和全屏内容区组成，侧边抽屉为临时导航
- **导航项**: 包含图标、文字标签、路由路径的结构，可标记当前激活状态
- **用户信息**: 顶栏/抽屉底部显示的用户头像和姓名，当前为占位数据

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: PC端侧边栏宽度、品牌区域、导航项高亮状态在所有三个PC端页面中一致显示
- **SC-002**: 移动端抽屉导航在两个移动端页面中正确高亮当前页面，点击导航项后抽屉关闭并正确跳转
- **SC-003**: 所有区域分隔均使用色调偏移或极淡边框，不存在粗实线边框分割大区域
- **SC-004**: 所有导航图标使用 lucide-react 图标，不使用其他图标库
- **SC-005**: 侧边栏和抽屉中的品牌文字、导航标签文字均与 Stitch 设计一致

## Assumptions

- 用户头像和姓名当前为占位数据，后续接入 Supabase Auth 后替换为真实数据
- 移动端抽屉中的标题根据当前路由动态变化，副标题固定为"建筑施工质检情报员"
- PC端面包屑的"首页"链接指向 /dashboard/overview
- 移动端导航只有两个入口（智能助手、工单列表），PC端有三个入口（数据概览、工单中心、知识库），与 Stitch 设计一致
- lucide-react 图标作为 Material Symbols 的替代，选择语义最接近的图标
- 颜色 token 通过 CSS 变量映射到 shadcn/ui 的设计系统，在 globals.css 中定义
- 不涉及登录页和鉴权逻辑的改动

## Clarifications

### Session 2026-04-12

- Q: 移动端抽屉中的页面标题应固定还是动态变化？ → A: 抽屉标题动态显示当前页面名称（如"智能助手"/"工单列表"），副标题固定为"建筑施工质检情报员"
