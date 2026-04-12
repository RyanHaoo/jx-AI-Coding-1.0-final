# Route Contracts: 项目初始化

**Branch**: `001-project-init` | **Date**: 2026-04-12

> 本阶段仅定义路由契约，API 端点契约属于后续阶段。

## Route Table

| Path                       | Method | Type     | Auth Required | Layout         | Description          |
|----------------------------|--------|----------|---------------|----------------|----------------------|
| `/`                        | GET    | Page     | No            | Root           | 首页，双端入口        |
| `/login`                   | GET    | Page     | No            | Root           | 登录页               |
| `/mobile/assistant`        | GET    | Page     | Yes (阶段二)  | Mobile         | 智能助手占位页        |
| `/mobile/tickets`          | GET    | Page     | Yes (阶段二)  | Mobile         | 工单列表占位页        |
| `/mobile/tickets/:id`      | GET    | Page     | Yes (阶段二)  | Mobile         | 工单详情占位页        |
| `/dashboard/overview`      | GET    | Page     | Yes (阶段二)  | Dashboard      | 数据大盘占位页        |
| `/dashboard/tickets`       | GET    | Page     | Yes (阶段二)  | Dashboard      | 工单中心占位页        |
| `/dashboard/knowledge`     | GET    | Page     | Yes (阶段二)  | Dashboard      | 知识运营占位页        |

## Layout Hierarchy

```
Root Layout (app/layout.tsx)
├── / → HomePage (no sub-layout)
├── /login → LoginPage (no sub-layout)
├── /mobile → MobileLayout (app/mobile/layout.tsx)
│   ├── /mobile/assistant
│   ├── /mobile/tickets
│   └── /mobile/tickets/[id]
└── /dashboard → DashboardLayout (app/dashboard/layout.tsx)
    ├── /dashboard/overview
    ├── /dashboard/tickets
    └── /dashboard/knowledge
```

## Login Redirect Contract

**Input**: URL query parameter `redirect`

**Rules**:
1. `redirect` must start with `/` (relative path)
2. `redirect` must not contain `//` (no protocol injection)
3. If `redirect` is invalid or missing, default to `/mobile/assistant`

**Output**: After login success, redirect to validated URL
