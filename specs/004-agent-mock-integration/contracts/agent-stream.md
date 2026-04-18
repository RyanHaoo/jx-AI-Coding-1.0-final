# Contract - Agent Stream API (Mock 阶段)

## Overview

- **Protocol**: HTTP + `text/event-stream`
- **Route**: 实现默认可使用 `/api/agent`（规范层不强制固定路由）
- **Auth Source**: 依赖当前登录态（Supabase 会话）

## Request

### Headers

- `Content-Type: application/json`

### Body (minimum)

```json
{
  "messages": [
    { "role": "user", "content": "查一下我的工单" }
  ],
  "config": {
    "configurable": {
      "thread_id": "user-uuid"
    }
  }
}
```

### Field Rules

- `config.configurable.thread_id` 必填，取当前登录用户唯一 ID
- `messages` 至少包含 1 条用户消息（普通提问场景）
- create_ticket 确认场景允许发送工具确认载荷（具体字段由实现约定）

## Stream Events

- `messages`: 大模型 token 增量 / 工具调用增量
- `values`: 聚合后的消息状态与 checkpoint 对齐内容
- `updates`: 预留事件通道（本阶段不依赖 interrupt/resume）

## Expected Behavior by Intent

1. **工单查询**: 返回结构化 mock 工单列表  
2. **知识问答**: 返回 mock 规范文本（Markdown）  
3. **创建工单**: 返回 `create_ticket` tool_call，前端渲染卡片并确认后返回 mock 成功  
4. **超范围**: 直接返回礼貌拒答文本

## Error Contract

- 网络或超时错误：前端显示错误气泡，用户手动重试
- 非法请求（缺 `thread_id` / 空消息）：返回 `400` + 错误说明
- 服务端异常：返回 `500` + 通用错误说明，不暴露内部细节
