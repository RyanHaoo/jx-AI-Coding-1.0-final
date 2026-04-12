import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import type { IdentityOption, Role } from "@/lib/types";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 7, // 7 days
};

export async function getIdentityFromCookie(): Promise<{
  projectId: number;
  projectName: string;
  role: Role;
} | null> {
  const cookieStore = await cookies();
  const projectId = cookieStore.get("active_project_id")?.value;
  const projectName = cookieStore.get("active_project_name")?.value;
  const role = cookieStore.get("active_role")?.value as Role | undefined;

  if (!projectId || !projectName || !role) return null;
  return { projectId: Number(projectId), projectName, role };
}

export async function writeIdentityCookie(
  projectId: number,
  projectName: string,
  role: Role,
) {
  const cookieStore = await cookies();
  cookieStore.set("active_project_id", String(projectId), COOKIE_OPTIONS);
  cookieStore.set("active_project_name", projectName, COOKIE_OPTIONS);
  cookieStore.set("active_role", role, COOKIE_OPTIONS);
}

export async function clearIdentityCookie() {
  const cookieStore = await cookies();
  cookieStore.delete("active_project_id");
  cookieStore.delete("active_project_name");
  cookieStore.delete("active_role");
}

export async function getIdentitiesForUser(
  userId: string,
): Promise<IdentityOption[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_roles")
    .select("project_id, role, projects(name)")
    .eq("user_id", userId);

  if (error || !data) return [];

  return data.map((row) => ({
    projectId: row.project_id,
    projectName: (row.projects as Array<{ name: string }>)[0]?.name ?? "",
    role: row.role as Role,
  }));
}
