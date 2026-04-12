# Research: 重构移动端与PC端通用页面框架

**Branch**: `003-stitch-layout-refactor` | **Date**: 2026-04-12

## Research Tasks

### 1. Stitch 设计系统色彩 token 与 shadcn/ui CSS 变量的映射方案

**Decision**: 在 globals.css 的 `:root` 中添加 Stitch 设计系统的语义化色彩 CSS 变量，作为 shadcn/ui 变量的补充。不替换 shadcn/ui 现有变量体系，而是新增 `--stitch-*` 命名空间的变量供框架组件直接使用。

**Rationale**:
- shadcn/ui 组件内部依赖 `--primary`, `--background` 等变量，直接替换可能导致组件样式异常
- 新增 `--stitch-*` 变量命名空间，框架组件直接使用 Stitch token，语义更清晰
- Stitch 的 surface-container-low / surface-container / surface-container-lowest 等色彩层级没有对应的 shadcn/ui 变量

**Alternatives considered**:
- 直接替换 shadcn/ui 的 CSS 变量 → 风险太高，可能破坏现有 shadcn/ui 组件样式
- 使用 Tailwind arbitrary values（如 `bg-[#f0f4f7]`）→ 硬编码色值，不可维护

### 2. 移动端抽屉标题动态变化的实现方式

**Decision**: 在移动端 layout 中定义一个路由到标题的映射表，通过 `usePathname()` 获取当前路径，查找映射表得到标题文本，传递给 MobileSideDrawer 组件。

**Rationale**:
- 路由-标题映射是固定配置，MVP 阶段直接内联在 layout 组件中即可
- usePathname() 已在现有 MobileSideDrawer 中使用，无需引入新依赖
- 符合"最小抽象"原则，少于 3 处使用不需要抽取为独立配置文件

**Alternatives considered**:
- 使用 Next.js metadata API → 过于复杂，且 metadata 主要用于 SEO
- 每个页面组件自行通过 context 传递标题 → 过度抽象

### 3. 面包屑导航的实现方式

**Decision**: 在 PC 端 layout 中定义路由到面包屑名称的映射表，通过 `usePathname()` 获取当前路径，生成面包屑。面包屑格式固定为"首页 / 当前页名"，"首页"链接指向 /dashboard/overview。

**Rationale**:
- PC 端路由层级简单（仅两级），不需要复杂的嵌套面包屑
- 直接内联映射表，符合"最小抽象"原则

**Alternatives considered**:
- 使用第三方面包屑库 → 过度依赖，功能远超需求
- 自动从路由路径生成 → 需要额外的路由-标题映射，不如直接查表简洁

### 4. 图标映射（lucide-react 替代 Material Symbols）

**Decision**: 使用以下 lucide-react 图标替代 Stitch 设计中的 Material Symbols：

| Stitch (Material Symbols) | lucide-react | 用途 |
|--------------------------|-------------|------|
| construction | Construction | PC 端品牌图标 |
| dashboard | LayoutDashboard | 数据概览 |
| assignment | ClipboardList | 工单中心/工单列表 |
| menu_book | BookOpen | 知识库 |
| chat | MessageSquare | 智能助手 |
| menu | Menu | 移动端菜单按钮 |
| send | Send | 发送按钮（暂不涉及） |

**Rationale**: lucide-react 是项目 PRD 指定的图标库，以上映射选择语义最接近的图标。

**Alternatives considered**:
- 同时引入 Material Symbols → 违反"实用技术栈"原则，增加包体积
- 使用其他图标库 → 同上

### 5. 边框分隔策略：从 border 到 outline-variant 色调偏移

**Decision**: 区域间分隔使用 `border-outline-variant/20`（极淡的 outline-variant 色），而非当前的 `border-border`（粗灰线）。Stitch 设计系统明确要求"无边界"规则，禁止使用 1px 实线边框进行大面积分栏。

**Rationale**:
- Stitch designMd 文档明确禁止 1px 实线边框大面积分栏
- outline-variant (#a9b4b9) 以 20% 透明度使用，视觉上极淡
- 通过添加 `--stitch-outline-variant` CSS 变量，组件中统一使用

**Alternatives considered**:
- 完全无边框，仅靠背景色差 → 侧边栏和主内容区色差不够明显时视觉区分不足
- 使用 shadow → Stitch 文档禁止阴影堆叠
