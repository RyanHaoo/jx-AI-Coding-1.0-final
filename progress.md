# 开发步骤大纲

> 策略：模块优先，假数据先行。每个模块先用 mock 数据完成界面，确认交互无误后再接真实数据。

## 阶段 1：项目初始化（已完成）
- 创建 Next.js 项目，配置 TypeScript、Tailwind CSS、shadcn/ui、lucide-react
- 定义全局类型（用户、项目、工单、角色等枚举与接口）
- 搭建基础路由结构（`/`、`/login`、`/mobile/*`、`/dashboard/*`）
- 首页（`/`）— 移动端入口 + PC 后台入口两个大按钮

## 阶段 2：登录与身份系统
- [x] 配置 Supabase（Auth + Database）
- [x] 创建用户数据表（profiles、projects、user_roles）及 RLS 策略
- [x] 准备种子数据（测试用户、项目、角色绑定）
- [x] 用户小组件（User Avatar Chip）、项目小组件（Project Chip）
- [x] 实现登录页（`/login`），对接 Supabase Auth
- [x] 实现登录后身份选择流程（弹框形式，多项目/角色选择，写入会话状态；切换身份时共用同一弹框）
- [x] 实现鉴权守卫中间件（移动端需登录、PC 端需管理员）
- [x] 导航用户模块（退出登录、切换身份弹框）

## 阶段 3：工单组件及其状态更改动作（已完成）
- [x] 创建工单数据表（当前阶段仅实现 `tickets`，按本阶段约束跳过 `ticket_logs`）及 RLS 策略
- [x] 完成工单详情组件（展示/编辑双模式，操作按钮根据身份与状态动态渲染）
- [x] 实现工单后端 API（详情、编辑、状态机动作、列表、创建）
- [x] 连接到真实数据（Supabase），并补充测试工单种子数据

## 阶段 4：移动端工单模块（进行中）
- [x] 移动端通用布局（顶栏 + 侧边目录抽屉 + 页面过渡动画）
- [x] 工单列表页基础版（`/mobile/tickets`）— 已接真实数据加载、加载态/空态/错误态
- [x] 工单详情页（`/mobile/tickets/:id`）— 已集成工单详情组件、编辑与状态操作逻辑
- [x] 工单列表完整版（005）：Tab 状态筛选、紧急置顶红框、列表卡片、骨架屏、404/返回按钮（spec `005-mobile-ticket-detail`）
- [ ] 工单列表增强（责任人筛选、排序切换）

## 最近修复（2026-04-18）
- [x] 修复身份选择后 Server Action 在 `/login` 被 Proxy 重定向打断的问题
- [x] 修复 `projectName` 解析兼容性（`projects` 关联对象/数组两种返回形态）
- [x] 修复移动端工单列表接口 `projectId` 丢失导致的 400 报错

## 阶段 5：Agent 对话模块
- Agent 对话页 UI（`/mobile/assistant`）— 消息流、输入区、加载态
- 搭建主 Agent 后端（LangChain createAgent、System Prompt）
- 实现工单查询 MCP（stdio，只读查询当前项目工单）
- 实现 create_ticket HITL tool_call（Agent → 前端工单创建卡片 → 用户确认 → API 创建）
- 前端对接 SSE 流式响应（LangChain useStream）
- 对接知识获取子 Agent（扣子平台外部 API）
- 接入 LangSmith 监控

## 阶段 6：PC 端管理模块（Mock 数据 → 真实数据）
- PC 端通用布局（顶栏 + 左侧菜单导航）
- 工单中心页（`/dashboard/tickets`）— 高级筛选 + 数据表格 + 右侧详情抽屉
- 数据大盘页（`/dashboard/overview`）— 统计指标卡片 + 严重程度柱状图
- 知识运营页（`/dashboard/knowledge`）— 候选池 + 转化弹窗 + QA 对列表 + 导出 CSV
- 知识运营 AI 总结：创建一个 AI API，使用 Openrouter 实现转化弹窗的「AI 总结」功能

## 阶段 7：联调收尾与部署
- 人工端到端流程测试（质检员报事 → 施工方处理 → 管理员监控 → 知识沉淀）
- Bug 修复与体验优化
- 部署到 Vercel
