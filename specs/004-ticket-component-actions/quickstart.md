# Quickstart: 工单组件与状态更改动作

**Branch**: `004-ticket-component-actions` | **Date**: 2026-04-12

## 前置条件

- Node.js 18+
- Supabase CLI（用于数据库迁移）
- 已有 `profiles`、`projects`、`user_roles` 三张表和种子数据

## 快速开始

### 1. 安装新增 shadcn/ui 组件

```bash
npx shadcn@latest add badge select
```

### 2. 创建数据库迁移

```bash
supabase migration new create_tickets_table
```

然后编辑生成的迁移文件，添加：
- `ticket_status`、`severity`、`specialty_type` 三个 ENUM 类型
- `tickets` 表及外键约束
- RLS 策略（读取=项目成员，写入=禁止直接操作）

### 3. 添加种子数据

在 `supabase/seed.sql` 中添加工单种子数据（3-5 条，覆盖不同状态）。

### 4. 运行迁移和种子

```bash
supabase db reset
```

### 5. 启动开发服务器

```bash
npm run dev
```

### 6. 验证

1. 登录后选择身份
2. 访问 `/mobile/tickets/1` 查看工单详情
3. 根据不同身份验证操作按钮显示/隐藏
4. 点击「解决」「拒绝」「重新打开」按钮验证状态变更

## 关键文件清单

| 文件 | 说明 | 状态 |
|------|------|------|
| `supabase/migrations/*_create_tickets_table.sql` | 创建 tickets 表 + ENUM + RLS | NEW |
| `supabase/seed.sql` | 工单种子数据 | NEW/UPDATE |
| `lib/tickets.ts` | 工单数据访问函数 | NEW |
| `app/api/tickets/route.ts` | GET 列表 + POST 创建 | NEW |
| `app/api/tickets/[id]/route.ts` | GET 详情 + PATCH 更新 | NEW |
| `app/api/tickets/[id]/actions/resolve/route.ts` | POST 解决 | NEW |
| `app/api/tickets/[id]/actions/reject/route.ts` | POST 拒绝 | NEW |
| `app/api/tickets/[id]/actions/reopen/route.ts` | POST 重新打开 | NEW |
| `components/project-chip.tsx` | 项目小组件 | NEW |
| `components/ticket-detail.tsx` | 工单详情组件（展示/编辑） | NEW |
| `components/ticket-actions.tsx` | 操作按钮区 | NEW |
| `components/ui/badge.tsx` | shadcn Badge | NEW |
| `components/ui/select.tsx` | shadcn Select | NEW |
| `app/mobile/tickets/[id]/page.tsx` | 工单详情页 | UPDATE |

## 开发顺序建议

按垂直切片实现，每个步骤完成后确认功能正确再进入下一步：

1. **数据层**: 迁移 + 种子数据 → 验证表结构和 RLS
2. **API 层**: GET 详情端点 → 验证数据获取
3. **组件层**: 工单详情组件（展示模式）→ 验证字段展示
4. **组件层**: 操作按钮区 → 验证权限渲染
5. **API 层**: 状态操作端点 → 验证状态变更
6. **组件层**: 工单详情组件（编辑模式）→ 验证编辑保存
7. **集成**: 页面组装 → 端到端验证