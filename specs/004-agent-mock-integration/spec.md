# Feature Specification: Agent 对话模块（Mock 实现）

**Feature Branch**: `004-agent-mock-integration`
**Created**: 2026-04-12
**Status**: Draft
**Input**: User description: "开发阶段5，其中 MCP 工具用一个最简单的mock实现，创建工单工具用一个最简单的按钮返回mock数据实现，此 agent 也用一个最简单的本地延时 mock 来实现"
**Revision**: 后端接入真实大模型（OpenRouter），create_ticket 确认后直接返回 mock 成功不调 API，MCP 和知识子 Agent 仍用最简 mock

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 智能助手对话界面（Priority: P1）

质检员打开移动端「智能助手」页面，看到一个对话式界面，包含消息流区域和底部输入区。用户输入文字后，消息发送至后端 Agent（接入真实大模型），Agent 以流式方式返回回复，消息以气泡形式流式展示。首次进入时显示欢迎语。

**Why this priority**: 对话界面是整个 Agent 模块的用户入口，没有界面其他功能无法交互验证

**Independent Test**: 打开 `/mobile/assistant`，输入任意文字，观察到消息发送、加载态、流式回复气泡出现的完整流程

**Acceptance Scenarios**:

1. **Given** 用户已登录并选择了质检员身份，**When** 用户进入智能助手页面，**Then** 页面显示对话界面，顶部显示「智能助手」标题，底部显示输入区（+ 按钮、文本框、发送按钮），消息区显示欢迎语
2. **Given** 用户在对话界面中，**When** 用户输入文本并点击发送，**Then** 用户消息以蓝色气泡显示在右侧，随后出现加载态气泡，Agent 通过流式响应逐步显示回复内容
3. **Given** Agent 正在响应中（加载态），**When** 用户尝试输入或发送，**Then** 输入区整体不可操作
4. **Given** 用户发送了多条消息，**When** 消息数量超过 6 轮（一问一答为一轮），**Then** 最早的一轮消息被丢弃，只保留最近 6 轮

---

### User Story 2 - 工单查询 Mock（Priority: P2）

用户在对话中提及工单相关内容（如"我的工单"、"工单 42 号"等），大模型识别为工单查询意图，调用 mock 的 queryTicket 工具，返回预设的工单数据，以结构化格式展示查询结果。

**Why this priority**: 工单查询是 Agent 三大核心能力之一，验证工具调用链路的完整性

**Independent Test**: 在对话中输入"查一下我的工单"，观察到 Agent 返回格式化的工单列表结果

**Acceptance Scenarios**:

1. **Given** 用户在对话界面中，**When** 用户输入包含工单查询意图的文字（如"我的工单有哪些"），**Then** 大模型识别意图并调用 queryTicket 工具，在加载态期间显示过程提示，最终返回当前项目的工单列表
2. **Given** Agent 返回了工单查询结果，**When** 结果展示在消息流中，**Then** 以结构化文本展示（编号、状态、严重程度、描述摘要、责任人、创建时间）
3. **Given** 工单查询无匹配结果，**When** Agent 返回空结果，**Then** 显示"当前项目下未找到符合条件的工单"提示

---

### User Story 3 - 工单创建 HITL Mock（Priority: P3）

质检员在对话中描述质量问题（如"3 号楼 5 层卫生间漏水"），大模型识别为创建工单意图，从输入中提取参数，返回 create_ticket tool_call。前端拦截该 tool_call，渲染工单创建表单卡片，用户可修改字段、选择责任人并确认提交。确认后不调用真实 API，直接返回 mock 成功结果。

**Why this priority**: HITL 是最复杂的交互链路，依赖对话界面和工具调用的基础能力已就绪

**Independent Test**: 输入一段质量问题描述，观察到工单创建卡片出现，填写确认后显示创建成功

**Acceptance Scenarios**:

1. **Given** 用户以质检员身份在对话中，**When** 用户输入包含质量问题特征的描述（如位置、问题等），**Then** 大模型识别创建意图并返回 tool_call，前端渲染工单创建卡片，预填大模型提取的字段（描述、位置、严重程度、专业类型）
2. **Given** 工单创建卡片已渲染，**When** 卡片中缺少必填参数（如未指定严重程度），**Then** 大模型在卡片出现前先追问用户补全信息
3. **Given** 工单创建卡片已渲染且参数完整，**When** 用户选择责任人并点击「确认提交」，**Then** 不调用真实 API，直接将卡片切换为只读无按钮版本，大模型回复"工单已创建成功，编号为 #XXX"
4. **Given** 用户为施工方或管理员身份，**When** 用户尝试创建工单，**Then** 大模型告知无报事权限，不渲染创建卡片

---

### User Story 4 - 知识问答 Mock（Priority: P3）

用户在对话中询问施工规范等知识性问题，大模型识别为知识查询意图，调用 mock 的知识子 Agent，返回预设的知识文本，以 Markdown 格式展示。

**Why this priority**: 知识问答是第三条核心链路，与工单查询和创建构成完整意图路由

**Independent Test**: 输入"混凝土强度等级有哪些要求"，观察到 Agent 返回格式化的知识解答

**Acceptance Scenarios**:

1. **Given** 用户在对话中，**When** 用户输入知识性问题（如"防水施工规范"），**Then** 大模型识别为知识查询意图并调用知识子 Agent，返回相关的规范条文和知识文本
2. **Given** 知识查询返回 Markdown 格式内容，**When** 展示在消息流中，**Then** 支持标题、加粗、列表等 Markdown 渲染

---

### User Story 5 - 意图路由（Priority: P2）

用户输入不同类型的问题，后端大模型能正确识别意图并路由到对应处理链路：知识问答 → 知识子 Agent、工单查询 → queryTicket MCP、创建工单 → create_ticket HITL、超范围 → 礼貌告知。

**Why this priority**: 意图路由由真实大模型驱动，是 Agent 的核心智能，决定了用户能否正确触达各功能

**Independent Test**: 依次输入知识类、工单查询类、创建工单类、无关话题，验证每条都被正确路由

**Acceptance Scenarios**:

1. **Given** 用户在对话中，**When** 用户输入与建筑施工质检无关的话题，**Then** Agent 礼貌告知超出服务范围
2. **Given** 用户输入混合意图（如先问规范再要求建单），**When** 大模型识别为混合意图，**Then** 先执行知识查询，再根据上下文决定是否触发创建工单

---

### Edge Cases

- Agent 响应超时或网络断开时，消息流显示错误提示气泡，用户需手动重新输入
- 工单创建 API 调用失败时，卡片底部展示错误信息，卡片保持可编辑状态（本阶段不涉及，确认直接返回成功）
- 用户连续快速发送多条消息时，只处理最新一条（Agent 响应期间输入区已禁用）
- 对话历史达到 6 轮上限后，最早的消息自动丢弃
- 非质检员角色尝试创建工单时，大模型基于 System Prompt 中的角色约束拒绝并提示权限不足

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: 系统 MUST 在 `/mobile/assistant` 页面提供对话式交互界面，包含顶栏、消息流区域和底部输入区
- **FR-002**: 系统 MUST 支持用户发送文本消息，并在消息流中以用户气泡（蓝色、右对齐）展示
- **FR-003**: 系统 MUST 在用户发送消息后立即显示加载态（如跳动点），并在 Agent 回复到达后替换为实际内容
- **FR-004**: 系统 MUST 在 Agent 响应期间禁用输入区，防止用户发送新消息
- **FR-005**: 系统 MUST 接入真实大模型（通过 OpenRouter，模型为 moonshotai/kimi-k2.5）作为 Agent 后端，通过标准流式响应返回 Agent 输出，前端使用 AI Elements 库消费流式数据
- **FR-006**: 系统 MUST 依赖大模型进行意图路由，由大模型根据 System Prompt 和对话上下文自动判断用户意图
- **FR-007**: 系统 MUST 实现 mock 的 queryTicket MCP 工具：返回预设的工单数据，以结构化格式展示查询结果
- **FR-008**: 系统 MUST 实现 create_ticket HITL：大模型返回普通 tool_call 后由前端渲染工单创建卡片，用户确认后不调用真实 API，直接返回 mock 成功结果（本阶段不使用 interrupt/resume 协议）
- **FR-009**: 系统 MUST 实现 mock 的知识子 Agent：返回预设的知识文本，支持 Markdown 渲染
- **FR-010**: 系统 MUST 限制每个 `thread_id` 下的对话历史为最多 6 轮，超出时丢弃最早一轮
- **FR-011**: 系统 MUST 在页面首次加载且无历史记录时显示欢迎语
- **FR-012**: 系统 MUST 仅允许质检员角色触发工单创建，施工方和管理员无此权限
- **FR-013**: 系统 MUST 在工单创建卡片中预填 Agent 提取的参数（描述、位置、严重程度、专业类型），并提供「责任人」下拉选择（必填）
- **FR-014**: 系统 MUST 在用户确认提交工单后，不调用真实 API，直接将卡片切换为只读无按钮版本，大模型回复创建成功消息
- **FR-015**: 系统 MUST 在 Agent 响应过程中显示过程提示（如"正在查询工单..."、"正在检索知识..."）
- **FR-016**: 系统 MUST 对与建筑施工质检无关的输入，由大模型礼貌告知超出服务范围
- **FR-017**: 系统 MUST 将用户当前身份信息（姓名、部门、角色、项目）注入大模型的 System Prompt，约束其行为边界
- **FR-018**: 系统 MUST 使用当前登录用户唯一 ID 作为 `thread_id`，并在刷新页面后按该 `thread_id` 恢复历史对话

### Key Entities

- **对话消息**: 对话中的单条消息，包含角色（用户/Agent）、内容（文本/tool_call/错误）、时间戳
- **Agent 工具调用**: Agent 返回的结构化指令，包含工具名和参数，前端据此渲染对应 UI 组件
- **工单创建卡片**: HITL 交互中的临时表单实体，包含工单字段（描述、位置、严重程度、专业类型、责任人），有编辑和只读两种状态

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 用户能在智能助手页面完成一次完整的对话交互（发送 → 加载态 → 流式收到回复），首 token 延迟不超过 3 秒
- **SC-002**: Agent 能正确识别 4 种意图类型（知识问答、工单查询、创建工单、超范围），路由准确率在典型输入下达到预期
- **SC-003**: 工单创建卡片能从 Agent tool_call 渲染，用户可编辑字段、选择责任人并确认提交，创建结果在 3 秒内反馈
- **SC-004**: MCP 和知识子 Agent 的 mock 工具调用返回预设数据，无需外部数据库或扣子平台依赖
- **SC-005**: 同一登录用户刷新页面后可恢复最近 6 轮对话历史，且恢复结果与刷新前一致

## Assumptions

- 后端接入真实大模型（通过 OpenRouter，模型为 moonshotai/kimi-k2.5），意图路由和回复生成由大模型完成，不再是关键词匹配 mock
- MCP 工具（queryTicket）使用最简 mock 实现，返回硬编码的工单数据，不连接真实数据库
- create_ticket HITL 走前端拦截 tool_call 流程：大模型返回普通 tool_call → 前端渲染卡片 → 用户确认 → 直接返回 mock 成功结果，不调用真实工单创建 API（本阶段不接入 interrupt/resume）
- 知识子 Agent 使用最简 mock 实现，返回预设的施工规范文本，不调用扣子平台 API
- 图片上传（+ 按钮）在本阶段暂不实现，用户仅通过文本输入交互
- 对话历史按 `thread_id` 持久化；`thread_id` 直接使用当前登录用户唯一 ID
- 欢迎语由大模型根据 System Prompt 生成，展示在对话开始时
- 消息流自动滚动到底部的行为在每次新消息到达时触发
- OpenRouter API Key 通过环境变量配置，不在代码中硬编码
- 使用 OpenRouter 上的 `moonshotai/kimi-k2.5` 模型
- 后端 API 使用标准流式响应，前端使用 AI Elements 库消费，不自行实现流式解析逻辑

## Clarifications

### Session 2026-04-12

- Q: Agent 通过 OpenRouter 接入大模型时，使用哪个模型？ → A: moonshotai/kimi-k2.5
- Q: 大模型响应超时时，前端应如何处理？ → A: 显示错误提示气泡，用户需手动重新输入
- Q: Agent 对话的后端 API 应如何暴露给前端？ → A: 使用标准流式响应，前端用 AI Elements 库消费，不自行实现流式解析

### Session 2026-04-18

- Q: 会话记忆策略与 thread_id 如何定义？ → A: 按 skill 直接完成持久化，thread_id 直接传入当前登录的唯一用户 ID
- Q: create_ticket HITL 是否采用 interrupt/resume 协议？ → A: 否，本阶段采用前端拦截普通 tool_call 的实现方式
- Q: Agent 对话 API 是否需要固定单一路由和固定请求体结构？ → A: 否，仅要求标准流式接口，不限定路由与请求体结构
