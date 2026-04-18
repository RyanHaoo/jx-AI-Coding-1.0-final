import { createClient } from "@/lib/supabase/server";
import type {
  Profile,
  Project,
  Severity,
  SpecialtyType,
  Ticket,
  TicketStatus,
} from "@/lib/types";

// Joined ticket type for API responses
export interface TicketWithRelations extends Ticket {
  creator: Pick<Profile, "id" | "name" | "department" | "avatar_url">;
  assignee: Pick<Profile, "id" | "name" | "department" | "avatar_url">;
  project: Pick<Project, "id" | "name" | "client_name">;
}

const RELATION_FIELDS = `
  id,
  status,
  severity,
  created_at,
  creator_id,
  project_id,
  assignee_id,
  specialty_type,
  description,
  location,
  images,
  detail,
  root_cause,
  prevention,
  knowledge_base,
  creator:profiles!creator_id (id, name, department, avatar_url),
  assignee:profiles!assignee_id (id, name, department, avatar_url),
  project:projects!project_id (id, name, client_name)
`;

export async function getTicketById(
  id: number,
): Promise<TicketWithRelations | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tickets")
    .select(RELATION_FIELDS)
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return flattenRelations(data);
}

export async function getTicketsByProject(
  projectId: number,
): Promise<TicketWithRelations[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tickets")
    .select(RELATION_FIELDS)
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data.map(flattenRelations);
}

interface CreateTicketInput {
  severity: Severity;
  project_id: number;
  assignee_id: string;
  specialty_type: SpecialtyType;
  description: string;
  location: string;
  detail?: string;
  images?: string[];
}

export async function createTicket(
  creatorId: string,
  input: CreateTicketInput,
): Promise<TicketWithRelations | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tickets")
    .insert({
      creator_id: creatorId,
      status: "待处理",
      ...input,
      detail: input.detail ?? "",
      images: input.images ?? [],
    })
    .select(RELATION_FIELDS)
    .single();

  if (error || !data) {
    if (error) console.error("[createTicket] insert failed:", error);
    return null;
  }
  return flattenRelations(data);
}

interface UpdateTicketInput {
  severity?: Severity;
  specialty_type?: SpecialtyType;
  description?: string;
  location?: string;
  detail?: string;
  images?: string[];
}

export async function updateTicket(
  id: number,
  input: UpdateTicketInput,
): Promise<TicketWithRelations | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tickets")
    .update(input)
    .eq("id", id)
    .select(RELATION_FIELDS)
    .single();

  if (error || !data) return null;
  return flattenRelations(data);
}

export async function updateTicketStatus(
  id: number,
  status: TicketStatus,
): Promise<TicketWithRelations | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tickets")
    .update({ status })
    .eq("id", id)
    .select(RELATION_FIELDS)
    .single();

  if (error || !data) return null;
  return flattenRelations(data);
}

type TicketRelations = {
  creator:
    | Pick<Profile, "id" | "name" | "department" | "avatar_url">
    | Array<Pick<Profile, "id" | "name" | "department" | "avatar_url">>;
  assignee:
    | Pick<Profile, "id" | "name" | "department" | "avatar_url">
    | Array<Pick<Profile, "id" | "name" | "department" | "avatar_url">>;
  project:
    | Pick<Project, "id" | "name" | "client_name">
    | Array<Pick<Project, "id" | "name" | "client_name">>;
};

// Supabase returns nested objects for joins, flatten to our interface.
function flattenRelations(data: Ticket & TicketRelations): TicketWithRelations {
  const { creator, assignee, project, ...ticket } = data;
  return {
    ...ticket,
    creator: Array.isArray(creator) ? creator[0] : creator,
    assignee: Array.isArray(assignee) ? assignee[0] : assignee,
    project: Array.isArray(project) ? project[0] : project,
  };
}
