// Enums

export type Role = "质检员" | "施工方" | "管理员";

export type ProjectType =
  | "地产项目"
  | "园区项目"
  | "景观项目"
  | "居住区项目"
  | "政府项目";

export type TicketStatus = "待处理" | "已完成" | "已拒绝";

export type Severity = "轻微" | "一般" | "严重" | "紧急";

export type SpecialtyType = "建筑设计专业" | "结构专业" | "给排水专业";

export type TicketAction =
  | "创建"
  | "解决"
  | "拒绝"
  | "指派他人"
  | "重新打开"
  | "编辑";

// Entities

export interface Profile {
  id: string;
  number: string;
  name: string;
  department: string;
  avatar_url: string;
  auth_email: string;
}

export interface Project {
  id: number;
  name: string;
  city: string;
  client_name: string;
  type: ProjectType;
}

export interface UserRole {
  id: number;
  user_id: string;
  project_id: number;
  role: Role;
}

export interface Ticket {
  id: number;
  status: TicketStatus;
  severity: Severity;
  created_at: string;
  creator_id: string;
  project_id: number;
  assignee_id: string;
  specialty_type: SpecialtyType;
  description: string;
  location: string;
  images: string[];
  detail: string;
  root_cause: string;
  prevention: string;
  knowledge_base: boolean;
}

export interface TicketLog {
  id: number;
  ticket_id: number;
  operator_id: string;
  action: TicketAction;
  field_diff: Record<string, unknown>;
  note: string;
  created_at: string;
}

// Auth & Identity

export interface IdentityOption {
  projectId: number;
  projectName: string;
  role: Role;
}

export interface LoginResult {
  success: boolean;
  error?: string;
  needsIdentitySelect?: boolean;
  identities?: IdentityOption[];
  redirectUrl?: string;
}
