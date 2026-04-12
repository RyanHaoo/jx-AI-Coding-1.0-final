# Feature Specification: 登录与身份系统 — 数据层

**Feature Branch**: `002-auth-identity-system`
**Created**: 2026-04-12
**Status**: Draft
**Input**: User description: "完成第二阶段的用户数据表和类型开发，先不开发界面和具体功能。"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 管理员创建用户和项目数据 (Priority: P1)

管理员通过 Supabase SQL 或种子脚本创建用户账号、项目和角色绑定。系统确保用户与项目/角色的多对多关系正确存储，且工号唯一。

**Why this priority**: 数据层是后续所有功能的基础，没有正确的表结构和种子数据，登录和身份选择无法进行。

**Independent Test**: 可通过 Supabase Dashboard 直接查询 profiles、projects、user_roles 表验证数据完整性和约束。

**Acceptance Scenarios**:

1. **Given** 数据库已创建 profiles、projects、user_roles 表，**When** 管理员插入一条 profiles 记录（含工号），**Then** 工号字段唯一约束生效，重复插入相同工号会被拒绝
2. **Given** 已有用户和项目数据，**When** 管理员在 user_roles 表插入一条角色绑定记录，**Then** 记录成功创建且外键约束正确关联到对应用户和项目
3. **Given** 一个用户在多个项目中担任不同角色，**When** 查询该用户的角色列表，**Then** 返回所有项目-角色组合

---

### User Story 2 - 登录用户按项目和角色读取数据 (Priority: P2)

已登录用户只能读取自己所在项目的用户、项目和角色数据，不能跨项目访问。管理员可读取所有数据。

**Why this priority**: RLS 策略是数据安全的核心保障，确保用户只能看到与自己项目相关的内容。

**Independent Test**: 以不同角色用户身份查询各表，验证 RLS 策略正确限制数据可见范围。

**Acceptance Scenarios**:

1. **Given** 质检员用户 A 属于项目 X，**When** 用户 A 查询 projects 表，**Then** 只能看到项目 X 的数据
2. **Given** 质检员用户 A 属于项目 X，**When** 用户 A 查询 user_roles 表，**Then** 只能看到项目 X 下的角色绑定记录
3. **Given** 管理员用户 B，**When** 用户 B 查询 profiles、projects、user_roles 表，**Then** 可以看到所有数据

---

### User Story 3 - TypeScript 类型与数据库表对齐 (Priority: P3)

前端 TypeScript 类型定义（lib/types.ts 中的 Profile、Project、UserRole 等接口和枚举）与 Supabase 数据库表结构完全对齐，包括字段名、类型映射和枚举值。

**Why this priority**: 类型对齐是前后端一致性的基础，确保开发时类型安全。

**Independent Test**: TypeScript 类型检查通过（tsc --noEmit），且类型字段与数据库列一一对应。

**Acceptance Scenarios**:

1. **Given** Supabase 数据库已创建所有表和枚举，**When** 运行 tsc --noEmit，**Then** 无类型错误
2. **Given** profiles 表包含 id、number、name、department、avatar_url 字段，**When** 对比 TypeScript 的 Profile 接口，**Then** 字段名和类型完全匹配

---

### Edge Cases

- 用户无任何角色绑定时，登录后应无法进入任何项目页面（但此阶段不做界面，仅确保数据层面 user_roles 表为空时查询返回空结果）
- 工号为空字符串时，唯一约束是否正确拒绝？应拒绝
- 外键约束下，删除 projects 表中的项目时，关联的 user_roles 记录应如何处理？（CASCADE 或 RESTRICT，根据数据定义选择）
- 管理员角色的 user_roles 记录可以不属于特定项目吗？根据 PRD，管理员也是"用户 × 项目 × 角色"三元组，因此管理员也必须绑定到项目

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: 系统必须创建 `profiles` 表，包含 id（UUID 主键，关联 Supabase Auth）、number（唯一工号）、name（姓名）、department（部门）、avatar_url（头像链接）字段
- **FR-002**: 系统必须创建 `projects` 表，包含 id（自增 INT 主键）、name（项目名称）、city（城市）、client_name（客户公司名称）、type（项目类型枚举）字段
- **FR-003**: 系统必须创建 `user_roles` 表，包含 id（自增 INT 主键）、user_id（关联 profiles.id 外键）、project_id（关联 projects.id 外键）、role（角色枚举）字段，并设置 (user_id, project_id, role) 唯一约束防止重复绑定
- **FR-004**: 系统必须创建所有枚举类型（project_type、role），使用 Postgres 原生 ENUM 类型（`CREATE TYPE ... AS ENUM`），枚举值严格匹配数据定义文档
- **FR-005**: 系统必须对 profiles 表的 number 字段设置唯一约束
- **FR-006**: 系统必须为三张表设置 RLS 策略：管理员可读写所有数据；所有登录用户可读 profiles 和 projects 表的全部内容；登录用户只能读取自己所在项目的 user_roles 记录
- **FR-007**: 系统必须提供种子数据，使用 Supabase 工具（MCP 创建用户 + execute_sql）创建，包含至少 3 个测试用户（分别担任质检员、施工方、管理员角色）、2 个测试项目、以及对应的角色绑定记录
- **FR-008**: TypeScript 类型定义必须与数据库表结构对齐，包括字段名、类型映射和枚举值
- **FR-009**: 系统必须对 user_roles 的外键设置合理的删除策略（删除项目时 RESTRICT 防止误删，删除用户时 CASCADE 自动清理角色绑定）

### Key Entities

- **profiles（用户）**: 存储用户业务信息，通过 id 关联 Supabase Auth。核心属性：工号（唯一标识登录）、姓名、部门、头像。与 user_roles 一对多。
- **projects（项目）**: 施工项目实体。核心属性：名称、城市、客户公司、项目类型。与 user_roles 一对多。
- **user_roles（用户身份）**: 用户 × 项目 × 角色的多对多关联表。一个用户可在不同项目中担任不同角色。核心属性：关联用户、关联项目、角色类型。
- **枚举 Role**: 质检员、施工方、管理员
- **枚举 ProjectType**: 地产项目、园区项目、景观项目、居住区项目、政府项目

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 通过 Supabase Dashboard 可以成功执行种子数据插入，所有唯一约束和外键约束均正确生效
- **SC-002**: 以不同角色用户身份查询各表时，RLS 策略正确限制数据可见范围：质检员/施工方只能看到自己项目数据，管理员可看到全部
- **SC-003**: TypeScript 类型检查（tsc --noEmit）通过，且 lib/types.ts 中的接口与数据库列完全对齐
- **SC-004**: 种子数据包含覆盖所有三种角色的测试用户，且至少有一个用户在多个项目中担任不同角色，验证多项目多角色场景

## Clarifications

### Session 2026-04-12

- Q: 种子数据中测试用户的创建方式？ → A: 使用 Supabase 提供的工具（包括创建用户和执行 SQL）来创建种子数据，不手动操作 auth.users 表
- Q: 枚举类型的实现方式？ → A: 使用 Postgres 原生 ENUM 类型（CREATE TYPE ... AS ENUM）
- Q: profiles 删除时 user_roles 的处理策略？ → A: profiles 删除时 CASCADE 到 user_roles，用户不存在则角色绑定自动清除

## Assumptions

- 本阶段仅完成数据层（数据库表、RLS、种子数据、TypeScript 类型），不涉及界面开发和登录流程实现
- Supabase 项目已创建并可访问，具备执行 SQL 迁移的权限
- 使用 Supabase Auth 进行用户认证，profiles 表的 id 字段与 Supabase Auth 用户 ID 对应
- 种子数据中的测试用户使用 Supabase 提供的工具（Supabase MCP 的创建用户功能和 execute_sql）来创建，包括 Auth 用户和 profiles 记录的关联
- RLS 策略中"管理员"角色的判断基于 user_roles 表中 role = '管理员' 的记录
- profiles 表的写权限仅限管理员（通过 RLS 策略实现），普通用户只能读取
- 本阶段不涉及登录页面、身份选择页面、鉴权中间件等界面和逻辑开发