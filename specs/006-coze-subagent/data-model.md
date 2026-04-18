# Phase 1 Data Model: Coze Subagent 工具集成

**Feature**: 006-coze-subagent  
**Date**: 2026-04-18  
**Status**: Complete — 本特性不新增数据库 schema，仅定义工具调用级数据模型与状态。

---

## 数据模型范围

本特性不涉及新增 Postgres 表或列。数据模型限定为主 agent 与 Coze 工具调用过程中的运行时实体。

## Entities

### 1) KnowledgeQuestion

用户在助手中发起的知识问题输入。

| 字段 | 类型 | 来源 | 约束 |
|------|------|------|------|
| `text` | string | 用户消息内容 | 非空；由主 agent 传入工具 schema 的 `question` |
| `userId` | string | Supabase 登录用户 `user.id` | 必填；用于传给 Coze `user_id` |
| `threadId` | string | 主 agent 会话线程 | 与 `userId` 一致（当前实现约定） |

### 2) CozeToolInvocation

一次知识工具调用上下文。

| 字段 | 类型 | 说明 |
|------|------|------|
| `toolName` | string | 重命名后的知识工具名 |
| `botId` | string | 从环境变量读取的 Coze bot 标识 |
| `tokenConfigured` | boolean | token 是否已配置（用于错误提示分支） |
| `signal` | AbortSignal | 用户取消时的中断信号 |
| `startedAt` | string (ISO datetime) | 调用开始时间（可选，用于日志） |

### 3) KnowledgeAnswer

工具返回给主 agent 的最终文本载荷。

| 字段 | 类型 | 约束 |
|------|------|------|
| `finalText` | string | 必须是最终回答文本；不得包含中间状态事件内容 |
| `isErrorFallback` | boolean | 标识是否为失败降级消息 |

---

## 状态转换

`CozeToolInvocation` 状态机（逻辑态）：

1. `initialized`：已拿到 question + userId + 配置
2. `streaming`：正在接收 Coze 流事件（内部态，不对主 agent/前端透出）
3. `resolved`：提取到最终 answer 文本并返回
4. `failed`：异常或鉴权失败，返回可读错误文本
5. `aborted`：收到取消信号后结束请求，不再返回中间内容

说明：`streaming` / `aborted` 等中间态仅用于工具内部控制，不进入主 agent conversation message state。

---

## 校验规则

- `question` 必须是非空字符串。
- `userId` 必须来自已登录用户上下文，不接受前端自传值覆盖。
- `botId` 与 `token` 必须来自环境变量；缺失时走可读错误降级。
- 工具返回值必须为字符串（最终回答或可读错误），不返回对象结构。

---

## 持久化与关系

- **数据库持久化**: 无新增持久化实体。
- **与既有系统关系**:
  - 主 agent thread persistence 继续由 LangGraph PostgresSaver 管理。
  - 工具调用输出作为 assistant/tool 既有链路的一部分被消费，但仅包含最终文本。
