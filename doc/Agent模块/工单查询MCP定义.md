# Agent 模块 — 工单查询 MCP 定义

> 工单查询通过 MCP 协议实现（只读），主 Agent 在每次对话开始时启动 stdio MCP 服务器，对话结束后自动停止。

---

## 1. 基本信息

| 属性 | 值 |
|------|---|
| 工具名 | `queryTicket` |
| 协议 | MCP (stdio) |
| 实现框架 | LangChain stdio MCP 集成 |
| 权限 | 只读；继承当前用户身份，只能查询当前项目下的工单 |
| 操作类型 | 纯读操作，不触发 HITL |

> **注意：** 工单的写操作（创建、解决、拒绝、指派、重新打开、编辑）统一通过 Next.js 后端 API 完成，**不走 MCP 通道**。

---

## 2. 工具定义（Tool Schema）

```json
{
  "name": "queryTicket",
  "description": "查询当前项目下的工单信息，支持按状态和关键词筛选",
  "parameters": {
    "type": "object",
    "properties": {
      "ticket_id": {
        "type": "integer",
        "description": "工单ID，精确查询指定工单（可选）"
      },
      "status": {
        "type": "string",
        "enum": ["待处理", "已完成", "已拒绝"],
        "description": "按状态筛选（可选）"
      },
      "keyword": {
        "type": "string",
        "description": "关键词搜索，匹配问题描述（可选）"
      },
      "assigned_to_me": {
        "type": "boolean",
        "description": "是否只查我负责的工单（默认 false）"
      }
    }
  }
}
```

---

## 3. 返回格式

```json
{
  "tickets": [
    {
      "id": 1,
      "status": "待处理",
      "severity": "严重",
      "specialty_type": "结构专业",
      "description": "3#楼标准层梁底裂缝",
      "location": "东区一期-3#住宅楼-标准层",
      "assignee": "张工",
      "created_at": "2026-03-15T10:30:00"
    }
  ],
  "total": 1
}
```

---

## 4. 权限约束

- 继承当前 Agent 调用时的用户身份上下文
- 只返回当前用户身份所在项目下的工单
- 不暴露其他项目的数据
