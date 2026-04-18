# Research: 工单组件与状态更改动作

**Branch**: `004-ticket-component-actions` | **Date**: 2026-04-12

## 研究任务与结论

### R1: Supabase 表设计 — tickets 表

**决策**: 创建 `tickets` 表，字段与 `lib/types.ts` 中 `Ticket` 接口一一对应。使用 PostgreSQL ENUM 类型保持与现有 `projects.type` 一致的风格。

**理由**: 数据库已有 `profiles`、`projects`、`user_roles` 三张表，均使用 RLS + 自定义 ENUM 类型。`tickets` 表应遵循相同模式。`id` 使用自增 INT（`GENERATED ALWAYS AS IDENTITY`），作为工单编号对外展示。

**考虑的替代方案**:
- UUID 主键 — 与数据定义文档冲突（文档明确要求自增 INT 作为工单 ID）
- 不使用 ENUM 类型（用 text + CHECK）— 与项目现有风格不一致

**结论**:
```sql
-- ENUM 类型
CREATE TYPE ticket_status AS ENUM ('待处理', '已完成', '已拒绝');
CREATE TYPE severity AS ENUM ('轻微', '一般', '严重', '紧急');
CREATE TYPE specialty_type AS ENUM ('建筑设计专业', '结构专业', '给排水专业');

-- tickets 表
CREATE TABLE tickets (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  status ticket_status NOT NULL DEFAULT '待处理',
  severity severity NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  creator_id UUID NOT NULL REFERENCES profiles(id),
  project_id BIGINT NOT NULL REFERENCES projects(id),
  assignee_id UUID NOT NULL REFERENCES profiles(id),
  specialty_type specialty_type NOT NULL,
  description TEXT NOT NULL,
  location TEXT NOT NULL,
  images TEXT[] NOT NULL DEFAULT '{}',
  detail TEXT NOT NULL DEFAULT '',
  root_cause TEXT NOT NULL DEFAULT '',
  prevention TEXT NOT NULL DEFAULT '',
  knowledge_base BOOLEAN NOT NULL DEFAULT false
);

-- RLS: 登录用户只能读取当前身份所在项目的工单
CREATE POLICY "Users can read tickets in their project"
  ON tickets FOR SELECT
  USING (project_id IN (
    SELECT ur.project_id FROM user_roles ur
    WHERE ur.user_id = auth.uid()
  ));

-- RLS: 不允许直接写入（必须通过后端 API）
CREATE POLICY "No direct write to tickets"
  ON tickets FOR INSERT WITH CHECK (false);
CREATE POLICY "No direct update to tickets"
  ON tickets FOR UPDATE USING (false);
CREATE POLICY "No direct delete on tickets"
  ON tickets FOR DELETE USING (false);
```

### R2: 后端 API 路由设计

**决策**: 使用 Next.js App Router 的 Route Handlers，采用 RESTful 风格。状态机操作使用独立子路由 `POST /api/tickets/[id]/actions/{resolve|reject|reopen}`。

**理由**: 状态机操作（解决、拒绝、重新打开）是领域行为而非简单 CRUD，独立路由语义更清晰。前端通过 Server Actions 或直接 fetch 调用。考虑到本阶段 MVP 定位，使用 Route Handler + 直接 fetch 更简单直接。

**考虑的替代方案**:
- Server Actions — 适合表单提交，但状态操作不是表单提交场景，且需要明确 HTTP 方法语义
- 单一 PATCH 端点带 action 参数 — 语义不如独立路由清晰

**结论**:
| 方法 | 路径 | 用途 |
|------|------|------|
| GET | `/api/tickets?projectId=N` | 获取项目下工单列表 |
| POST | `/api/tickets` | 创建工单（为 Agent 模块预留） |
| GET | `/api/tickets/[id]` | 获取工单详情 |
| PATCH | `/api/tickets/[id]` | 更新工单（编辑模式保存） |
| POST | `/api/tickets/[id]/actions/resolve` | 解决工单 |
| POST | `/api/tickets/[id]/actions/reject` | 拒绝工单 |
| POST | `/api/tickets/[id]/actions/reopen` | 重新打开工单 |

所有写入端点必须：
1. 从 cookie 获取当前用户身份（`getIdentityFromCookie`）
2. 校验操作权限（角色 + 工单状态前置条件）
3. 管理员拥有所有操作权限

### R3: 工单详情组件架构

**决策**: 使用 `"use client"` 的 React 组件，通过 props 接收初始工单数据，内部管理 view/edit 状态切换。状态操作通过 `fetch` 调用后端 API，操作期间禁用按钮。

**理由**: 工单详情组件需要交互（模式切换、按钮点击），必须是客户端组件。初始数据在 Server Component（页面）中通过 Supabase 服务端客户端获取，序列化传给客户端组件。

**考虑的替代方案**:
- 纯 Server Component — 无法处理交互状态
- 全部客户端获取 — 服务端获取更符合 Next.js App Router 模式，减少水合闪烁

**结论**:
```
app/mobile/tickets/[id]/page.tsx (Server Component)
  → 获取工单数据 + 用户身份
  → 渲染 <TicketDetail> (Client Component)
      → view/edit 模式切换
      → <TicketActions> 操作按钮区
      → 状态操作 fetch 调用
```

### R4: 状态操作的前端交互

**决策**: 点击操作按钮后直接调用 API，无需弹窗或表单。API 调用期间按钮禁用，完成后刷新页面数据。

**理由**: 用户在澄清阶段明确要求"点击动作按钮直接完成动作，暂不弹对话框也不要求补充输入"。这大幅简化了前端实现。

**考虑的替代方案**:
- 确认弹窗（"确定要解决此工单吗？"）— 用户明确跳过
- 内联表单填写 — 用户明确跳过

**结论**: 操作按钮点击 → 立即 fetch API → 禁用按钮防重复 → 成功后 `router.refresh()` 刷新数据。

### R5: 需要新增的 shadcn/ui 组件

**决策**: 需要新增 `Badge` 和 `Select` 两个 shadcn/ui 组件。

**理由**:
- `Badge`: 用于展示工单状态（待处理/已完成/已拒绝），是 FR-003 的核心展示需求
- `Select`: 用于编辑模式下枚举字段（严重程度、专业类型）的下拉选择，是 FR-008 的核心交互需求

**结论**: 运行 `npx shadcn@latest add badge select` 安装。

### R6: 项目小组件（ProjectChip）

**决策**: 新建 `components/project-chip.tsx`，展示格式为 `项目名称（客户名称）`。

**理由**: 规格文档 FR-003 要求"所在项目（项目小组件）"，与已有 `UserAvatarChip` 对应。`doc/核心组件/用户组件.md` 中定义了项目小组件的展示格式。

**结论**: 简单的内联展示组件，接收 `name` 和 `clientName` props，渲染为 `name（clientName）` 格式。

### R7: 数据获取模式

**决策**: 工单详情页使用 Server Component 获取初始数据，客户端组件通过 `router.refresh()` 触发服务端重新获取。

**理由**: Next.js App Router 的标准模式——Server Component 获取数据，客户端操作后刷新。避免了客户端状态管理的复杂性，符合 MVP 最小抽象原则。

**结论**:
- 页面级 Server Component: `createClient()` 获取工单 + 关联用户/项目数据
- 客户端操作后: `router.refresh()` 触发 Server Component 重新渲染
- 无需全局状态管理库