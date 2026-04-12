# Data Model: 重构移动端与PC端通用页面框架

**Branch**: `003-stitch-layout-refactor` | **Date**: 2026-04-12

## Entities

本功能为纯 UI 框架重构，不涉及数据库实体。以下为组件内使用的配置型数据结构。

### NavItem（导航项）

| 字段 | 类型 | 说明 |
|------|------|------|
| label | string | 导航项显示文本（中文） |
| href | string | 路由路径 |
| icon | LucideIcon | lucide-react 图标组件 |

### BreadcrumbItem（面包屑项）

| 字段 | 类型 | 说明 |
|------|------|------|
| label | string | 面包屑显示文本 |
| href | string | 链接路径（首页有链接，当前页无链接） |

## Navigation Configuration

### PC 端导航项

| label | href | icon |
|-------|------|------|
| 数据概览 | /dashboard/overview | LayoutDashboard |
| 工单中心 | /dashboard/tickets | ClipboardList |
| 知识运营 | /dashboard/knowledge | BookOpen |

### 移动端导航项

| label | href | icon |
|-------|------|------|
| 智能助手 | /mobile/assistant | MessageSquare |
| 工单列表 | /mobile/tickets | ClipboardList |

### 移动端路由-标题映射

| pathname prefix | drawer title |
|-----------------|-------------|
| /mobile/assistant | 智能助手 |
| /mobile/tickets | 工单列表 |

### PC 端路由-面包屑映射

| pathname | breadcrumb name |
|----------|----------------|
| /dashboard/overview | 数据大盘 |
| /dashboard/tickets | 工单中心 |
| /dashboard/knowledge | 知识运营 |

## CSS Variables (Stitch Token)

新增的 `--stitch-*` CSS 变量（添加到 globals.css `:root`）：

| 变量名 | 值 | 用途 |
|--------|------|------|
| --stitch-primary | #005ac2 | 主色 |
| --stitch-primary-container | #d8e2ff | 主色容器（导航项高亮背景） |
| --stitch-on-primary-container | #004eaa | 主色容器上的文字 |
| --stitch-on-surface-variant | #566166 | 次要文字色 |
| --stitch-background | #f7f9fb | 全局背景 |
| --stitch-surface | #f7f9fb | 表面 |
| --stitch-surface-container-low | #f0f4f7 | 低层级容器（侧边栏） |
| --stitch-surface-container | #e8eff3 | 中层级容器（主内容区） |
| --stitch-surface-container-lowest | #ffffff | 最底层容器（卡片/移动端内容区） |
| --stitch-surface-container-high | #e1e9ee | 高层级容器 |
| --stitch-outline-variant | #a9b4b9 | 轮廓变体（极淡分隔线） |
