# Data Model - Agent 对话模块（Mock 实现）

## 1) ConversationThread

- **Purpose**: 标识一个可持久化的会话线程。  
- **Key Fields**:
  - `threadId: string` - 当前登录用户唯一 ID（稳定主键）
  - `maxRounds: number` - 固定为 6
  - `updatedAt: string` - 最近一次消息更新时间
- **Rules**:
  - 同一用户始终复用同一 `threadId`
  - 超过 6 轮时裁剪最早轮次

## 2) ConversationMessage

- **Purpose**: 对话消息统一表示，支持文本/错误/tool_call 展示。  
- **Key Fields**:
  - `id: string`
  - `role: "user" | "assistant" | "tool"`
  - `content: string`
  - `type: "text" | "tool_call" | "error"`
  - `createdAt: string`
- **Rules**:
  - 流式中间态不单独持久化，最终消息入 checkpoint
  - 错误消息作为普通消息落在消息流中

## 3) AgentToolCall

- **Purpose**: 大模型触发工具调用时的结构化负载。  
- **Key Fields**:
  - `name: "queryTicket" | "create_ticket" | "knowledge_query"`
  - `arguments: Record<string, unknown>`
  - `status: "pending" | "resolved" | "failed"`
- **Rules**:
  - `create_ticket` 由前端拦截并渲染卡片
  - `queryTicket` 与 `knowledge_query` 直接返回 mock 数据

## 4) CreateTicketCardState

- **Purpose**: HITL 创建工单卡片在前端的编辑态/只读态。  
- **Key Fields**:
  - `description: string`
  - `location: string`
  - `severity: "轻微" | "一般" | "严重" | "紧急"`
  - `specialtyType: "建筑设计专业" | "结构专业" | "给排水专业"`
  - `assigneeId: string`
  - `mode: "editable" | "readonly"`
- **Rules**:
  - `assigneeId` 为必填
  - 用户确认后必须切换 `readonly`，且不再展示操作按钮

## 5) IdentityContextForPrompt

- **Purpose**: 约束模型行为边界的身份上下文。  
- **Key Fields**:
  - `userId: string`
  - `name: string`
  - `department: string`
  - `role: "质检员" | "施工方" | "管理员"`
  - `projectId: number`
  - `projectName: string`
- **Rules**:
  - 仅在服务端拼装并注入 System Prompt
  - 当 `role !== "质检员"` 时，创建工单必须拒绝
