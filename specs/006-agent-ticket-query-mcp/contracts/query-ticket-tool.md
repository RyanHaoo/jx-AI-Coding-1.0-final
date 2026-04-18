# Contract: `query_ticket` MCP Tool

**Feature**: 006-agent-ticket-query-mcp  
**Date**: 2026-04-18  
**Scope**: 定义 Agent 与本地 MCP server 之间的查询工具契约（非 HTTP API）。

---

## 1. Tool Identity

- **Tool name**: `query_ticket`
- **Agent wrapper name**: `queryTicket`（LangChain tool，内部转发到 `query_ticket`）
- **Transport**: Local `stdio` MCP server
- **Purpose**: 查询当前 session 权限范围内的工单摘要列表

---

## 2. Input Contract

### 2.1 Model-visible arguments

```json
{
  "status": "待处理 | 已完成 | 已拒绝",
  "severity": "轻微 | 一般 | 严重 | 紧急",
  "specialty_type": "建筑设计专业 | 结构专业 | 给排水专业",
  "keyword": "string",
  "limit": 10
}
```

Rules:

- 所有字段可选；
- `limit` 缺省为 10，最大 50；
- 非法枚举值视为参数错误。

### 2.2 Runtime-only argument (injected by wrapper)

```json
{
  "supabase_access_token": "<jwt>"
}
```

Rules:

- 不向模型暴露；
- 仅在本次 tool 执行上下文中使用；
- 不进入消息历史与 checkpoint。

---

## 3. Output Contract

成功返回（text content 为 JSON 字符串）：

```json
{
  "items": [
    {
      "id": 123,
      "status": "待处理",
      "severity": "严重",
      "description": "3号楼5层卫生间渗漏",
      "location": "3号楼5层卫生间",
      "created_at": "2026-04-18T08:20:00.000Z",
      "assignee_name": "李施工",
      "project_name": "翡翠湾花园"
    }
  ],
  "total": 12,
  "truncated": true
}
```

失败返回（受控错误）：

```json
{
  "error": {
    "code": "UNAUTHENTICATED | QUERY_FAILED | INVALID_ARGUMENT",
    "message": "human-readable message"
  }
}
```

---

## 4. Behavioral Guarantees

- 仅返回当前用户会话可访问数据（RLS 兜底）；
- 默认按 `created_at` 倒序；
- 结果字段仅包含摘要字段，不返回大字段；
- 命中数量超过 `limit` 时必须设置 `truncated=true`。

---

## 5. Validation Matrix

| Case | Input | Expected |
|------|-------|----------|
| 默认查询 | `{}` | 返回 <=10 条，按时间倒序 |
| 上限保护 | `{"limit": 999}` | 实际返回 <=50 条，含 `truncated` 语义 |
| 条件筛选 | `{"status":"待处理","severity":"紧急"}` | 仅返回满足条件项 |
| 未登录 | 无 token | 返回 `UNAUTHENTICATED` |
| 跨项目尝试 | 用户切换身份后同样查询 | 仅返回当前身份项目数据 |
