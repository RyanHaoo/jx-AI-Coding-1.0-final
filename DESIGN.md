# DESIGN.md — Stitch 设计系统规范

本项目 UI 严格遵循 Stitch 设计系统（Material Design 3 音调分层法）。所有新增界面元素必须遵守以下规范。

## 色彩 Token

CSS 变量定义在 `app/globals.css` 的 `:root` 中，使用 `--stitch-*` 命名空间，与 shadcn/ui 变量并存。

### 主色系

| 变量名 | 值 | 用途 |
|--------|------|------|
| `--stitch-primary` | `#005ac2` | 主色（品牌强调、关键操作） |
| `--stitch-primary-container` | `#d8e2ff` | 主色容器（导航项高亮背景、选中态） |
| `--stitch-on-primary-container` | `#004eaa` | 主色容器上的文字 |
| `--stitch-on-surface-variant` | `#566166` | 次要文字（非激活导航项、描述文字） |

### 背景层级（音调分层 Tonal Layering）

从浅到深排序，层级越高颜色越深：

| 变量名 | 值 | 层级 | 典型用途 |
|--------|------|------|----------|
| `--stitch-surface-container-lowest` | `#ffffff` | 最底层 | 卡片、移动端内容区、顶栏 |
| `--stitch-surface-container-low` | `#f0f4f7` | 低 | PC 侧边栏、移动端抽屉 |
| `--stitch-surface-container` | `#e8eff3` | 中 | PC 主内容区背景 |
| `--stitch-surface-container-high` | `#e1e9ee` | 高 | 悬停态背景 |
| `--stitch-background` | `#f7f9fb` | 全局 | 页面基础背景 |
| `--stitch-surface` | `#f7f9fb` | 表面 | 通用表面色 |

### 分隔与轮廓

| 变量名 | 值 | 用途 |
|--------|------|------|
| `--stitch-outline-variant` | `#a9b4b9` | 区域间分隔线（需配合 20% 透明度） |

## 布局规范

### PC 端布局

```
┌──────────┬──────────────────────────────┐
│          │  顶栏 (h-16)                  │
│  侧边栏   │  面包屑 + 用户信息             │
│  w-64    ├──────────────────────────────┤
│          │                              │
│  品牌区   │  主内容区                      │
│  + 导航   │  surface-container + p-6     │
│          │                              │
└──────────┴──────────────────────────────┘
```

- 侧边栏宽度：`w-64`（256px）
- 顶栏高度：`h-16`（64px）
- 侧边栏背景：`surface-container-low`
- 主内容区背景：`surface-container`
- 主内容区内边距：`p-6`

### 移动端布局

```
┌──────────────────────────────┐
│  顶栏 (h-12)                  │
│  菜单按钮 + 页面标题           │
├──────────────────────────────┤
│                              │
│  主内容区                      │
│  surface-container-lowest     │
│  + p-4                       │
│                              │
└──────────────────────────────┘
```

- 顶栏高度：`h-12`（48px）
- 抽屉宽度：`w-64`（256px），从左侧滑出
- 抽屉背景：`surface-container-low`
- 主内容区背景：`surface-container-lowest`
- 主内容区内边距：`p-4`

## 通用视觉规则

### 无边界规则（No-Line Rule）

**禁止使用粗实线边框分割大区域**。区域间分隔使用以下方式之一：

1. **色调偏移**：通过背景色差异区分区域（推荐）
2. **极淡轮廓线**：`border-[var(--stitch-outline-variant)]/20`（20% 透明度）

适用场景：侧边栏与主内容区间、品牌区与导航区间、导航区与用户区间。

### 禁止的视觉效果

- 粗实线边框（`border-border`）用于大面积分栏
- 渐变背景
- 重阴影（`shadow-lg`、`shadow-2xl`）
- 发光效果

### 导航项样式

| 状态 | 背景 | 文字 | 其他 |
|------|------|------|------|
| 激活（当前页） | `primary-container` | `on-primary-container` | `font-medium` |
| 非激活 | 透明 | `on-surface-variant` | — |
| 悬停（非激活） | `surface-container-high` | `on-surface-variant` | — |

导航项统一使用圆角卡片样式：`rounded-lg px-3 py-2.5`，图标+文字水平排列 `flex items-center gap-3`。

### 面包屑

格式：`首页 / 当前页名`，使用 `ChevronRight` 图标分隔。

- "首页"：`on-surface-variant` 色，链接指向 `/dashboard/overview`
- 当前页名：`foreground` 色，`font-medium`

## 图标

所有图标必须使用 `lucide-react`，不引入其他图标库。

### 图标映射表

| 用途 | lucide-react 组件 | 使用位置 |
|------|-------------------|----------|
| 品牌 | `Construction` | PC 侧边栏品牌区 |
| 数据概览 | `LayoutDashboard` | PC 侧边栏导航 |
| 工单 | `ClipboardList` | PC 侧边栏 / 移动端抽屉 |
| 知识库 | `BookOpen` | PC 侧边栏导航 |
| 智能助手 | `MessageSquare` | 移动端抽屉导航 |
| 菜单 | `Menu` | 移动端顶栏 |
| 面包屑分隔 | `ChevronRight` | PC 顶栏 |

### 图标尺寸

| 场景 | 尺寸 |
|------|------|
| 品牌图标 | `size-6` |
| 导航项图标 | `size-5` |
| 面包屑分隔 | `size-4` |

## 用户信息占位

当前用户头像和姓名为占位数据，样式规范：

- 头像：`size-8`（PC）/ `size-9`（移动端抽屉），圆形 `rounded-full`，背景 `primary-container`，文字 `on-primary-container`
- 姓名：`text-sm font-medium`
- 角色（移动端）：`text-xs`，色 `on-surface-variant`

后续接入 Supabase Auth 后替换数据源，保持样式不变。

## CSS 变量使用方式

在 Tailwind 类名中通过 `var()` 引用 Stitch 变量：

```tsx
// 背景
bg-[var(--stitch-surface-container-low)]

// 文字色
text-[var(--stitch-on-surface-variant)]

// 极淡分隔线
border-[var(--stitch-outline-variant)]/20
```

不要在 Tailwind 中使用硬编码色值（如 `bg-[#f0f4f7]`），始终引用 CSS 变量。
