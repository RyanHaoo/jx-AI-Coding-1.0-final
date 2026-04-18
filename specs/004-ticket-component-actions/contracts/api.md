# API Contracts: 工单后端 API

**Branch**: `004-ticket-component-actions` | **Date**: 2026-04-12

## 通用规则

- 所有写入端点需从 cookie 获取当前用户身份（`getIdentityFromCookie`）
- 所有写入端点需校验操作权限（角色 + 状态前置条件）
- 管理员拥有所有操作权限
- 返回格式统一为 JSON

## 端点列表

### GET /api/tickets

获取工单列表（当前用户所在项目）

**Query Parameters**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| projectId | number | 否 | 项目 ID，不传则使用当前身份项目 |

**Response 200**:
```json
{
  "tickets": [
    {
      "id": 1,
      "status": "待处理",
      "severity": "严重",
      "created_at": "2026-04-12T10:00:00Z",
      "creator_id": "uuid-1",
      "project_id": 1,
      "assignee_id": "uuid-2",
      "specialty_type": "结构专业",
      "description": "钢筋保护层偏差",
      "location": "东区一期-3#住宅楼-标准层",
      "images": [],
      "detail": "",
      "root_cause": "",
      "prevention": "",
      "knowledge_base": false,
      "creator": { "id": "uuid-1", "name": "张三", "department": "质量部", "avatar_url": "" },
      "assignee": { "id": "uuid-2", "name": "李四", "department": "施工一组", "avatar_url": "" },
      "project": { "id": 1, "name": "星河湾一期", "client_name": "星河集团" }
    }
  ]
}
```

### POST /api/tickets

创建工单（为 Agent 模块预留）

**Request Body**:
```json
{
  "severity": "严重",
  "project_id": 1,
  "assignee_id": "uuid-2",
  "specialty_type": "结构专业",
  "description": "钢筋保护层偏差",
  "location": "东区一期-3#住宅楼-标准层",
  "detail": "",
  "images": []
}
```

**Response 201**:
```json
{
  "ticket": { /* 完整工单对象，含关联数据 */ }
}
```

**Response 403**: `{ "error": "只有质检员可以创建工单" }`

### GET /api/tickets/[id]

获取工单详情

**Response 200**:
```json
{
  "ticket": {
    "id": 1,
    "status": "待处理",
    /* ... 所有字段 ... */
    "creator": { "id": "uuid-1", "name": "张三", "department": "质量部", "avatar_url": "" },
    "assignee": { "id": "uuid-2", "name": "李四", "department": "施工一组", "avatar_url": "" },
    "project": { "id": 1, "name": "星河湾一期", "client_name": "星河集团" }
  }
}
```

**Response 404**: `{ "error": "工单不存在" }`

### PATCH /api/tickets/[id]

更新工单（编辑模式保存）

**Request Body**:
```json
{
  "severity": "严重",
  "specialty_type": "结构专业",
  "description": "钢筋保护层偏差（更新）",
  "location": "东区一期-3#住宅楼-标准层",
  "detail": "补充详情",
  "images": []
}
```

**权限**: 当前用户是发起人或当前责任人

**Response 200**:
```json
{
  "ticket": { /* 更新后的完整工单对象 */ }
}
```

**Response 403**: `{ "error": "无权编辑此工单" }`

### POST /api/tickets/[id]/actions/resolve

解决工单

**Request Body**: 无（本阶段不要求填写问题归因和预防建议）

**权限**: 当前用户是当前责任人或管理员；工单状态为「待处理」

**Response 200**:
```json
{
  "ticket": { "status": "已完成", /* ... */ }
}
```

**Response 403**: `{ "error": "无权执行此操作" }`
**Response 409**: `{ "error": "工单状态不允许此操作" }`

### POST /api/tickets/[id]/actions/reject

拒绝工单

**Request Body**: 无（本阶段不要求填写拒绝原因）

**权限**: 当前用户是当前责任人或管理员；工单状态为「待处理」

**Response 200**:
```json
{
  "ticket": { "status": "已拒绝", /* ... */ }
}
```

### POST /api/tickets/[id]/actions/reopen

重新打开工单

**Request Body**: 无（本阶段不要求填写打开原因）

**权限**: 当前用户是发起人或管理员；工单状态为「已完成」或「已拒绝」

**Response 200**:
```json
{
  "ticket": { "status": "待处理", /* ... */ }
}
```

## 错误响应格式

所有错误响应统一格式：
```json
{ "error": "错误描述" }
```

| 状态码 | 场景 |
|--------|------|
| 400 | 请求参数无效 |
| 401 | 未登录 |
| 403 | 无操作权限 |
| 404 | 工单不存在 |
| 409 | 工单状态不允许此操作 |