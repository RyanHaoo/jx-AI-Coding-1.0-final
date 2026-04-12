# Agent 模块 — 工单创建 HITL Tool 定义

> Human-In-The-Loop 工单创建工具。主 Agent 不直接创建工单，而是通过 tool_call 通知前端渲染确认卡片，由用户补充信息后前端调用后端 API 完成创建。

---

## 1. 设计说明

**为什么使用 HITL？**

工单的指派直接影响施工方的工作安排，由 AI 自动决定责任人存在误判风险。即使 Agent 能从对话上下文推断出责任人信息，当前设计下也不会自动填入，以保持 Agent 和前端职责的清晰分离，避免错误指派。

**流程：**
```
主Agent识别创建工单意图
→ 返回 create_ticket tool_call（含预填参数）
→ 前端拦截 tool_call，渲染工单创建卡片
→ 用户检查/修改字段，选择责任人（必填）
→ 用户确认提交
→ 前端调用 POST /api/tickets
→ 成功后前端将工单 ID 作为 tool_call result 返回给 Agent
→ Agent 告知用户创建成功
```

---

## 2. Tool Call 定义

```json
{
  "name": "create_ticket",
  "description": "创建一条质检工单。需要提供问题描述、位置、严重程度、专业类型等信息。",
  "parameters": {
    "type": "object",
    "properties": {
      "description": {
        "type": "string",
        "description": "问题描述，简要说明发现了什么问题"
      },
      "location": {
        "type": "string",
        "description": "详细位置，如楼栋-楼层-区域"
      },
      "severity": {
        "type": "string",
        "enum": ["轻微", "一般", "严重", "紧急"],
        "description": "严重程度"
      },
      "specialty_type": {
        "type": "string",
        "enum": ["建筑设计专业", "结构专业", "给排水专业"],
        "description": "专业类型"
      },
      "detail": {
        "type": "string",
        "description": "问题详情补充（可选）"
      },
      "images": {
        "type": "array",
        "items": { "type": "string" },
        "description": "图片URL列表（可选）"
      }
    },
    "required": ["description", "location", "severity", "specialty_type"]
  }
}
```

---

## 3. 前端卡片渲染规则

前端收到 `create_ticket` tool_call 后：

1. **不渲染纯文本**，渲染工单创建表单卡片（复用工单详情组件的编辑状态）
2. 将 tool_call 参数**预填**到表单对应字段
3. 额外显示「责任人」下拉选择（**必填**，从当前项目的施工方用户列表中选择）
4. 用户可修改任何字段
5. 底部显示「确认提交」按钮

**提交后：**
1. 前端调用 `POST /api/tickets`，传入所有字段（含用户选择的责任人）
2. 成功后向 Agent 发送结构化 JSON（不渲染气泡）：
   ```json
   { "tool_result": "create_ticket", "ticket_id": 42 }
   ```
3. 上一条消息的工单卡片切换为**只读 + 无按钮**版本
4. Agent 收到后回复：「工单已创建成功，编号为 #42」

**参考组件：** [核心组件/工单组件.md](../核心组件/工单组件.md)（编辑状态，额外增加责任人字段）
