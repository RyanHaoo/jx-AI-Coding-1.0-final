# Data Model: 工单组件与状态更改动作

**Branch**: `004-ticket-component-actions` | **Date**: 2026-04-12

## 新增实体

### Ticket（工单）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | `BIGINT` | PK, GENERATED ALWAYS AS IDENTITY | 工单编号（自增） |
| `status` | `ticket_status` | NOT NULL, DEFAULT '待处理' | 工单状态 |
| `severity` | `severity` | NOT NULL | 严重程度 |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT now() | 创建时间 |
| `creator_id` | `UUID` | NOT NULL, FK → profiles.id | 发起人 |
| `project_id` | `BIGINT` | NOT NULL, FK → projects.id | 所属项目 |
| `assignee_id` | `UUID` | NOT NULL, FK → profiles.id | 当前责任人 |
| `specialty_type` | `specialty_type` | NOT NULL | 专业类型 |
| `description` | `TEXT` | NOT NULL | 问题描述 |
| `location` | `TEXT` | NOT NULL | 详细位置 |
| `images` | `TEXT[]` | NOT NULL, DEFAULT '{}' | 图片 URL 列表 |
| `detail` | `TEXT` | NOT NULL, DEFAULT '' | 问题详情 |
| `root_cause` | `TEXT` | NOT NULL, DEFAULT '' | 问题归因 |
| `prevention` | `TEXT` | NOT NULL, DEFAULT '' | 预防建议 |
| `knowledge_base` | `BOOLEAN` | NOT NULL, DEFAULT false | 是否已转化知识库 |

### 新增 ENUM 类型

| 类型名 | 值 |
|--------|-----|
| `ticket_status` | '待处理', '已完成', '已拒绝' |
| `severity` | '轻微', '一般', '严重', '紧急' |
| `specialty_type` | '建筑设计专业', '结构专业', '给排水专业' |

## 状态转换

```
待处理 ──解决──→ 已完成
待处理 ──拒绝──→ 已拒绝
已完成 ──重新打开──→ 待处理
已拒绝 ──重新打开──→ 待处理
```

| 操作 | 允许角色 | 前置状态 | 本阶段是否实现 |
|------|---------|---------|--------------|
| 解决 | 当前责任人 / 管理员 | 待处理 | ✅ |
| 拒绝 | 当前责任人 / 管理员 | 待处理 | ✅ |
| 重新打开 | 发起人 / 管理员 | 已完成 / 已拒绝 | ✅ |
| 指派他人 | 当前责任人 / 管理员 | 待处理 | ❌ 本阶段跳过 |

## 关系图

```
profiles (已有)
  ├── 1:N ── tickets.creator_id (发起人)
  └── 1:N ── tickets.assignee_id (责任人)

projects (已有)
  └── 1:N ── tickets.project_id (所属项目)

user_roles (已有)
  └── 用于权限校验：当前用户在项目中的角色
```

## RLS 策略

| 策略 | 操作 | 规则 |
|------|------|------|
| 读取工单 | SELECT | 用户可读取所在项目（user_roles）的工单 |
| 直接写入 | INSERT/UPDATE/DELETE | 全部禁止（必须通过后端 API） |

## 与已有表的关系

- `tickets.creator_id` → `profiles.id`：发起人关联用户
- `tickets.assignee_id` → `profiles.id`：责任人关联用户
- `tickets.project_id` → `projects.id`：工单关联项目
- 权限校验通过 `user_roles` 表判断当前用户在指定项目中的角色