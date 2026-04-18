# Implementation Plan: Coze Subagent 工具集成

**Branch**: `006-coze-subagent` | **Date**: 2026-04-18 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/006-coze-subagent/spec.md`

## Summary

将主 agent 的知识检索工具从 mock 实现升级为 Coze 实时调用：重命名并替换 `knowledge_query`（落地名 `consult_construction_knowledge`），使用环境变量 `COZE_API_TOKEN` 与 `COZE_BOT_ID`（可选 `COZE_BASE_URL`）调用 Coze 对话流，工具侧仅聚合并返回最终答案文本。实现中保持现有 LangChain SSE 架构不变，确保 Coze 子流程中间状态不进入主 agent message state，也不出现在前端流式渲染中。按用户要求，规划阶段不扩展 edge case 设计，只覆盖核心主路径与必要失败降级。

## Technical Context

**Language/Version**: TypeScript 5.x  
**Primary Dependencies**: Next.js 16.2.3 (App Router), langchain 1.3.x, @langchain/react, @supabase/ssr, zod, 新增 `@coze/api`  
**Storage**: Supabase Postgres（仅复用现有用户身份与 LangGraph checkpoint；本特性不新增数据表）  
**Testing**: 不新增自动化测试（遵循宪法 MVP 原则）；执行 `npx tsc --noEmit` + `npm run lint` 进行门禁校验  
**Target Platform**: Node.js server runtime（`app/api/agent/route.ts`） + 移动端 Web 聊天界面  
**Project Type**: 单仓 Next.js Web application（前后端一体）  
**Performance Goals**: 保持现有助手流式体感；知识问答回包延迟在可接受交互区间（MVP 无严格 SLA）  
**Constraints**: 工具返回必须仅为最终文本；不得暴露 Coze 中间事件；用户中断需可取消 Coze 请求；不改动现有会话线程模型  
**Scale/Scope**: 影响 1 个工具定义文件、1 个前端工具标签映射文件、1 个环境变量示例文件；新增 1 个 Coze 客户端辅助模块（可选）

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| 原则 | 检查结果 | 计划中的落实方式 |
|------|----------|------------------|
| I. MVP 优先交付 | ✅ 通过 | 仅实现 Coze 工具替换与最小失败降级，不做缓存、多 bot、会话记忆等扩展 |
| II. 核心路径正确性 | ✅ 通过 | 保持主链路：用户提问 → 主 agent 工具调用 → 最终回答回传；不改变现有 SSE 与线程机制 |
| III. 最小抽象 | ✅ 通过 | 工具实现就近放在现有 agent tools 体系中，避免过度抽象层；仅在必要处新增轻量 helper |
| IV. 实用技术栈 | ✅ 通过 | 延续既有 Next.js + LangChain + Supabase；新增 `@coze/api` 与 PRD 技术栈一致 |

**Gate 结论（Phase 0 前）**：通过，无阻塞项。  
**Gate 复核（Phase 1 后）**：通过，设计产物未引入额外复杂度或宪法违规项。

## Project Structure

### Documentation (this feature)

```text
specs/006-coze-subagent/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── agent-tool.md
└── checklists/
    └── requirements.md
```

### Source Code (repository root)

```text
app/
└── api/
    └── agent/
        └── route.ts                         # 无结构性改动，仅复用已有 req.signal 与 user.id 上下文

components/
└── agent/
    └── tool-call-card.tsx                  # 更新工具名到展示文案映射

lib/
└── agent/
    ├── tools.ts                            # 替换/重命名知识工具并接入 Coze 调用
    └── (optional) coze-client.ts           # Coze stream 聚合为最终文本的轻量封装

.env.example                                # 新增 Coze token / bot_id 示例配置
```

**Structure Decision**: 沿用现有 Next.js 单仓结构。后端调用逻辑维持在 `lib/agent/*`，前端仅做工具名展示映射更新，避免跨层重构。

## Complexity Tracking

本特性无宪法违规项，无需额外复杂度豁免。
