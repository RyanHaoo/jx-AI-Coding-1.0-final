import { NextResponse } from "next/server";
import { getIdentityFromCookie } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createTicket, getTicketsByProject } from "@/lib/tickets";
import type { Severity, SpecialtyType } from "@/lib/types";

export async function GET(request: Request) {
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

  const tickets = await getTicketsByProject(projectId);

  return NextResponse.json({ tickets });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const identity = await getIdentityFromCookie();
  if (identity?.role !== "质检员") {
    return NextResponse.json(
      { error: "只有质检员可以创建工单" },
      { status: 403 },
    );
  }

  const body = (await request.json()) as {
    severity: Severity;
    project_id: number;
    assignee_id: string;
    specialty_type: SpecialtyType;
    description: string;
    location: string;
    detail?: string;
    images?: string[];
  };

  const ticket = await createTicket(user.id, body);
  if (!ticket) {
    return NextResponse.json({ error: "工单创建失败" }, { status: 500 });
  }

  return NextResponse.json({ ticket }, { status: 201 });
}
