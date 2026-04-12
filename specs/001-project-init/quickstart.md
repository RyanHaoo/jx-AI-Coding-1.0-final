# Quickstart: 项目初始化

**Branch**: `001-project-init` | **Date**: 2026-04-12

## Prerequisites

- Node.js 18+ (项目使用 Next.js 16，推荐 Node 24 LTS)
- npm

## Setup

```bash
# 安装依赖（已有 node_modules 可跳过）
npm install

# 启动开发服务器
npm run dev

# 访问 http://localhost:3000
```

## Verification Checklist

1. 访问 `/` → 看到两个入口按钮（移动端 / PC 管理端）
2. 点击"移动端"按钮 → 跳转到 `/mobile/assistant`（显示占位页和移动端布局）
3. 点击"PC 管理端"按钮 → 跳转到 `/dashboard/overview`（显示占位页和 PC 端布局）
4. 访问 `/login` → 看到工号和密码输入框
5. 访问 `/login?redirect=/mobile/tickets` → redirect 参数显示在表单中
6. 依次访问所有占位页面 → 均正常渲染
7. 移动端布局：顶栏 + 侧边目录抽屉
8. PC 端布局：顶栏 + 左侧菜单导航
9. 类型检查通过：`npx tsc --noEmit`
10. Lint 通过：`npm run lint`

## Build Check

```bash
npm run build
```

应无编译错误。
