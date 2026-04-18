# Contract: 主 Agent × Coze 知识工具

**Feature**: 006-coze-subagent  
**Date**: 2026-04-18

本文定义本特性涉及的接口契约：主 agent 工具调用输入/输出、可见性边界、以及与现有 `/api/agent` 流式接口的兼容约束。

---

## 1. Tool Registration Contract

### 1.1 工具定位

- 工具定义位置：`lib/agent/tools.ts`
- 工具注册方式：加入 `allTools`，由 `lib/agent/index.ts` 注入 `createAgent({ tools })`

### 1.2 工具名称契约

- `knowledge_query` 由 `consult_construction_knowledge` 替代
- 前端工具展示映射（`components/agent/tool-call-card.tsx`）需同步工具新名称

---

## 2. Tool Input Contract

> 该输入由主 LLM 调用工具时生成，非前端直接传入。

```ts
{
  question: string
}
```

### 输入约束

- `question`：必填，用户原始知识问题。
- 调用上下文必须含已登录用户 ID（用于 Coze `user_id`）。

---

## 3. Coze Request Contract (internal)

### 请求来源

- token: `COZE_API_TOKEN`
- bot_id: `COZE_BOT_ID`
- baseURL: `COZE_BASE_URL`（默认 `https://api.coze.cn`）
- user_id: 当前登录平台用户 `user.id`
- message: 工具参数 `question`

### 行为约束

- 必须使用流式调用并在工具内部聚合结果。
- 必须支持中断信号透传（abort）。

---

## 4. Tool Output Contract

### 输出形态

工具返回值固定为 `string`：

- 成功：最终回答文本（仅 answer）
- 失败：可读错误文本（用于主 agent 向用户解释）

### 可见性边界

- Coze 中间事件（如 delta、状态更新、调试事件）不得写入主 agent message state。
- Coze 中间事件不得通过 `/api/agent` SSE 向前端发出。

---

## 5. 与 `/api/agent` 的兼容契约

- 不变更现有 endpoint：`POST /api/agent`
- 不变更现有 SSE 编码与 `streamMode` 配置
- 本特性只替换工具内部数据源，不更改路由输入输出协议

---

## 6. Error Contract

- 鉴权失败（token/bot_id 无效或缺失）→ 返回可读失败文本
- 上游超时/网络错误 → 返回可读失败文本
- 用户取消请求（abort）→ 停止上游请求并避免输出中间内容

---

## 7. Non-Goals (for this contract)

- 不返回 references / follow-up / 调试元数据
- 不定义多 bot 路由策略
- 不定义跨请求会话记忆同步协议
