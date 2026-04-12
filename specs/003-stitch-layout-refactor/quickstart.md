# Quickstart: 重构移动端与PC端通用页面框架

**Branch**: `003-stitch-layout-refactor` | **Date**: 2026-04-12

## Prerequisites

- Node.js 24 LTS
- 依赖已安装（`npm install`）

## Development Setup

```bash
# 确保在正确的分支
git checkout 003-stitch-layout-refactor

# 启动开发服务器
npm run dev

# 访问页面验证
# PC端: http://localhost:3000/dashboard/overview
# 移动端: http://localhost:3000/mobile/assistant
```

## Verification Checklist

### PC 端验证

1. 访问 /dashboard/overview → 左侧侧边栏显示品牌区+3个导航项，"数据概览"高亮
2. 点击"工单中心" → 跳转并高亮，面包屑更新为"首页 / 工单中心"
3. 点击"知识运营" → 跳转并高亮，面包屑更新为"首页 / 知识运营"
4. 检查侧边栏背景色为浅蓝灰（#f0f4f7），主内容区为更浅蓝灰（#e8eff3）
5. 检查侧边栏与主内容区间分隔线极淡

### 移动端验证

1. 访问 /mobile/assistant → 顶栏显示菜单按钮+"智能助手"标题
2. 点击菜单按钮 → 左侧滑出抽屉，标题"智能助手"+副标题"建筑施工质检情报员"
3. 抽屉底部显示用户信息区
4. 点击"工单列表" → 抽屉关闭，跳转，标题变为"工单列表"
5. 访问 /mobile/tickets → 抽屉中"工单列表"高亮

### 通用验证

- 无粗实线边框分割大区域
- 所有图标使用 lucide-react
- `npm run lint` 通过
- `npx tsc --noEmit` 通过

## Key Files

| 文件 | 变更类型 | 说明 |
|------|----------|------|
| app/globals.css | 修改 | 添加 Stitch 色彩 CSS 变量 |
| components/dashboard-side-nav.tsx | 重写 | PC 端侧边栏（品牌+导航+高亮） |
| components/dashboard-top-bar.tsx | 重写 | PC 端顶栏（面包屑+用户信息） |
| components/mobile-top-bar.tsx | 重写 | 移动端顶栏（菜单+标题） |
| components/mobile-side-drawer.tsx | 重写 | 移动端抽屉（标题+导航+用户） |
| app/dashboard/layout.tsx | 修改 | 使用新的布局结构和色彩 |
| app/mobile/layout.tsx | 修改 | 使用新的布局结构和色彩 |
