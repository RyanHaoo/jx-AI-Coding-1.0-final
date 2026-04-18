import { NextResponse } from "next/server";
import { getIdentitiesForUser, getIdentityFromCookie } from "@/lib/auth";
import { getAssigneesByProject } from "@/lib/profiles";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const url = new URL(request.url);
  const projectIdParam = url.searchParams.get("projectId");

  let projectId: number | null = null;
  if (projectIdParam != null && projectIdParam !== "") {
    const n = Number(projectIdParam);
    if (!Number.isNaN(n)) projectId = n;
  }
  if (projectId == null) {
    const identity = await getIdentityFromCookie();
    projectId = identity?.projectId ?? null;
  }
  if (projectId == null) {
    const identities = await getIdentitiesForUser(user.id);
    projectId = identities[0]?.projectId ?? null;
  }

  if (projectId == null || Number.isNaN(projectId)) {
    return NextResponse.json(
      { error: "缺少有效的 projectId" },
      { status: 400 },
    );
  }

  const assignees = await getAssigneesByProject(projectId);
  return NextResponse.json({ assignees });
}
