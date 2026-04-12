# Data Model: 项目初始化

**Branch**: `001-project-init` | **Date**: 2026-04-12

> 本阶段仅定义 TypeScript 类型，不涉及数据库表创建。类型与 `doc/数据定义.md` 严格对应。

## Enums

```typescript
// 用户角色
type Role = "质检员" | "施工方" | "管理员"

// 项目类型
type ProjectType = "地产项目" | "园区项目" | "景观项目" | "居住区项目" | "政府项目"

// 工单状态
type TicketStatus = "待处理" | "已完成" | "已拒绝"

// 严重程度
type Severity = "轻微" | "一般" | "严重" | "紧急"

// 专业类型
type SpecialtyType = "建筑设计专业" | "结构专业" | "给排水专业"

// 工单变更操作
type TicketAction = "创建" | "解决" | "拒绝" | "指派他人" | "重新打开" | "编辑"
```

## Entities

### Profile

| Field       | Type   | Notes                  |
|-------------|--------|------------------------|
| id          | string | UUID，主键，对应 Auth ID |
| number      | string | 工号，不可重复不可编辑    |
| name        | string | 姓名                   |
| department  | string | 部门                   |
| avatar_url  | string | 头像图片链接            |

### Project

| Field       | Type   | Notes           |
|-------------|--------|-----------------|
| id          | number | 自增 INT，主键   |
| name        | string | 项目名称         |
| city        | string | 城市            |
| client_name | string | 客户公司名称     |
| type        | ProjectType | 项目类型    |

### UserRole

| Field      | Type   | Notes              |
|------------|--------|--------------------|
| id         | number | 自增 INT，主键      |
| user_id    | string | 外键 → profiles.id  |
| project_id | number | 外键 → projects.id  |
| role       | Role   | 用户在该项目中的角色 |

### Ticket

| Field          | Type       | Notes                     |
|----------------|------------|---------------------------|
| id             | number     | 自增 INT，主键（工单编号）   |
| status         | TicketStatus | 状态，默认"待处理"        |
| severity       | Severity   | 严重程度                   |
| created_at     | string     | ISO DateTime              |
| creator_id     | string     | 外键 → profiles.id         |
| project_id     | number     | 外键 → projects.id         |
| assignee_id    | string     | 外键 → profiles.id         |
| specialty_type | SpecialtyType | 专业类型               |
| description    | string     | 问题描述                   |
| location       | string     | 详细位置                   |
| images         | string[]   | 图片 URL 列表              |
| detail         | string     | 问题详情（非必填）          |
| root_cause     | string     | 问题归因（解决时必填）      |
| prevention     | string     | 预防建议（非必填）          |
| knowledge_base | boolean    | 是否已转化为知识库，默认 false |

### TicketLog

| Field       | Type         | Notes                       |
|-------------|--------------|-----------------------------|
| id          | number       | 自增 INT，主键               |
| ticket_id   | number       | 外键 → tickets.id            |
| operator_id | string       | 外键 → profiles.id           |
| action      | TicketAction | 操作类型                     |
| field_diff  | Record<string, unknown> | JSONB，只存新值     |
| note        | string       | 操作说明                     |
| created_at  | string       | ISO DateTime                |

## Relationships

```
Profile 1──N UserRole N──1 Project
Profile 1──N Ticket (as creator)
Profile 1──N Ticket (as assignee)
Project 1──N Ticket
Ticket  1──N TicketLog
Profile 1──N TicketLog (as operator)
```
