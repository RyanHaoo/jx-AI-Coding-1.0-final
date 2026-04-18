# Implementation Plan: Agent 工单查询 MCP 接入

**Branch**: `006-agent-ticket-query-mcp` | **Date**: 2026-04-18 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/006-agent-ticket-query-mcp/spec.md`

## Summary

将 Agent 的 `queryTicket` mock 能力替换为真实的 MCP 工单查询能力：新增本地 stdio MCP server 仅暴露 `query_ticket`，由 Agent 侧在每次工具调用前注入当前登录用户的 Supabase access token，依赖现有 RLS 保证项目级数据隔离。保持 `knowledge_query` 与 `create_ticket` mock 不变，优先打通查询主链路，满足 MVP 可用性与权限正确性。

## Technical Context

**Language/Version**: TypeScript 5.x（Next.js 16.2.3 项目）+ Node.js 运行时脚本（`.mjs`）  
**Primary Dependencies**: `langchain` / `@langchain/core` / `@langchain/mcp-adapters` / `@modelcontextprotocol/sdk` / `zod` / `@supabase/supabase-js` / `@supabase/ssr`  
**Storage**: Supabase Postgres（`tickets` + 关联 `profiles`/`projects`，由 RLS 限制可见范围）  
**Testing**: 按宪法不新增测试；执行 `npx tsc --noEmit` + `npm run lint` + 本地手工查询链路验证  
**Target Platform**: Next.js Node.js server runtime + 同机本地 MCP stdio 子进程  
**Project Type**: Web application（Next.js 单仓库，前后端一体）  
**Performance Goals**: MCP 工具冷启动 <= 1.5s；单次查询链路端到端 <= 3s（常规项目数据量）  
**Constraints**: 仅实现单工具 `query_ticket`；默认 limit=10、上限 50；仅返回摘要字段；token 不进入 checkpoint 持久化  
**Scale/Scope**: 变更 4 个现有文件（`app/api/agent/route.ts`、`lib/agent/tools.ts`、`lib/agent/index.ts`、可选 `lib/agent/model|prompts` 无改动）+ 新增 2~3 个文件（`mcp/ticket-query-server.mjs`、`lib/agent/mcp-client.ts`、可选 `lib/agent/types.ts`）

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

对照 `.specify/memory/constitution.md`：

| 原则 | 适用性 | 计划落地方式 |
|------|--------|--------------|
| I. MVP 优先交付 | ✅ 通过 | 仅替换 `queryTicket`，其余工具保持 mock；不扩展分页/排序/多工具统计 |
| II. 核心路径正确性 | ✅ 通过 | 保持“当前身份→当前项目数据”主链路，查询权限完全依赖 Supabase RLS 与当前会话 |
| III. 最小抽象 | ✅ 通过 | 只新增一个 MCP client 封装用于复用 stdio 连接；不引入额外服务层 |
| IV. 实用技术栈 | ✅ 通过 | 完全沿用 Next.js + Supabase + LangChain + MCP 既有栈，不引入替代基础设施 |

**Gate 结果（Phase 0 前）**：通过，无阻断项。  
**Gate 复检（Phase 1 后）**：通过，设计产物未引入违背宪法的新抽象或超范围能力。

## Project Structure

### Documentation (this feature)

```text
specs/006-agent-ticket-query-mcp/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── tasks.md
├── contracts/
│   └── query-ticket-tool.md
└── checklists/
    └── requirements.md
```

### Source Code (repository root)

```text
app/
└── api/
    └── agent/
        └── route.ts                    # [修改] 从 Supabase session 获取 access_token 并通过 configurable 透传

lib/
└── agent/
    ├── index.ts                        # [修改] 异步初始化 MCP tools 并组装 createAgent
    ├── tools.ts                        # [修改] queryTicket 改为 MCP 包装调用 + token 注入
    └── mcp-client.ts                   # [新增] MultiServerMCPClient 单例与 query_ticket tool 获取

mcp/
└── ticket-query-server.mjs             # [新增] stdio MCP server（仅 query_ticket）
```

**Structure Decision**: 维持 Next.js 单仓结构。MCP server 作为本地进程脚本放在 `mcp/`，Agent 运行时适配逻辑放在 `lib/agent/`，避免跨层散落并保持最小新增面。

## Complexity Tracking

> 无需填写：Constitution Check 无违规项。
