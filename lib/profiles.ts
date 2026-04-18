import { createClient } from "@/lib/supabase/server";
import type { Profile, Role } from "@/lib/types";

export type AssigneeOption = Pick<Profile, "id" | "name" | "department">;

export async function getAssigneesByProject(
  projectId: number,
  role: Role = "施工方",
): Promise<AssigneeOption[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_roles")
    .select("profiles!user_id (id, name, department)")
    .eq("project_id", projectId)
    .eq("role", role);

  if (error || !data) return [];

  const rows = data as Array<{
    profiles:
      | Pick<Profile, "id" | "name" | "department">
      | Array<Pick<Profile, "id" | "name" | "department">>
      | null;
  }>;

  return rows
    .map((row) => {
      const p = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
      if (!p) return null;
      return { id: p.id, name: p.name, department: p.department };
    })
    .filter((x): x is AssigneeOption => x !== null);
}
