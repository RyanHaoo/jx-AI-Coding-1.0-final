import { NextResponse } from "next/server";
import { getIdentityFromCookie } from "@/lib/auth";
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
  const identity = await getIdentityFromCookie();
  const projectId = projectIdParam
    ? Number(projectIdParam)
    : (identity?.projectId ?? null);

  if (!projectId || Number.isNaN(projectId)) {
    return NextResponse.json(
      { error: "缺少有效的 projectId" },
      { status: 400 },
    );
  }

  const assignees = await getAssigneesByProject(projectId);
  return NextResponse.json({ assignees });
}
