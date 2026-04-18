# Quickstart: Agent 工单查询 MCP 接入验收

**Feature**: 006-agent-ticket-query-mcp  
**Date**: 2026-04-18

用于在本地验证“查询工单”从对话到 MCP 再到 Supabase RLS 的完整主链路。

---

## 前置准备

1. 安装依赖并启动项目：

```bash
npm install
npm run dev
```

2. 确保环境变量可用：
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `OPENROUTER_BASE_URL`
   - `OPENROUTER_API_KEY`
   - `AGENT_MODEL_ID`
   - `DATABASE_URL`

3. 准备两个项目身份（同账号）以及各自工单数据，用于验证跨项目隔离。

---

## 场景 1：主流程查询（P1）

1. 登录并选择项目 A 身份。
2. 打开 `/mobile/assistant` 发送“有哪些待处理工单”。
3. 预期：
   - Agent 触发 `query_ticket`；
   - 返回工单摘要列表（含 `id/status/severity/description/location/created_at/assignee_name/project_name`）；
   - 不出现大字段内容。

## 场景 2：结构化筛选（P2）

1. 继续发送“查询严重且待处理的工单，最多 5 条”。
2. 预期：
   - 返回项满足筛选条件；
   - 返回条数 <= 5；
   - 结果顺序按创建时间倒序。

## 场景 3：上限与截断（P2）

1. 发送“查询全部工单，返回 100 条”。
2. 预期：
   - 实际返回 <= 50 条；
   - 响应含 `truncated=true`（或等价截断语义）；
   - Agent 提示可继续细化条件。

## 场景 4：跨项目隔离（P1）

1. 在项目 A 身份查询一次并记录结果特征。
2. 切换到项目 B 身份，发送相同查询。
3. 预期：
   - 返回集合仅来自项目 B；
   - 不出现项目 A 工单（泄漏率为 0）。

## 场景 5：未登录降级（P1）

1. 退出登录或使 session 失效后访问助手并触发查询。
2. 预期：
   - 工具返回受控错误；
   - Agent 回答“请重新登录后再试”或等价提示；
   - 不返回任何工单数据。

---

## 收尾校验

```bash
npx tsc --noEmit
npm run lint
```

若上述检查通过且 5 个场景均符合预期，即可进入 `/speckit-tasks`。

---

## 实施回填记录（2026-04-18）

### 自动化校验

- `npx tsc --noEmit`：PASS
- `npm run lint`：PASS

### 场景执行记录

- 场景 1（主流程查询）：待人工在浏览器环境验收
- 场景 2（结构化筛选）：待人工在浏览器环境验收
- 场景 3（上限与截断）：待人工在浏览器环境验收
- 场景 4（跨项目隔离）：待人工在浏览器环境验收
- 场景 5（未登录降级）：待人工在浏览器环境验收

说明：本次 `/speckit-implement` 已完成后端与 Agent 接入实现及静态质量检查，交互场景需在联调环境以真实账号完成验收。
