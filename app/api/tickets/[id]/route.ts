import { NextResponse } from "next/server";
import { getIdentityFromCookie } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getTicketById, updateTicket } from "@/lib/tickets";
import type { Severity, SpecialtyType } from "@/lib/types";

type RouteContext = { params: Promise<{ id: string }> };

function parseTicketId(id: string) {
  const ticketId = Number(id);
  if (Number.isNaN(ticketId)) return null;
  return ticketId;
}

export async function GET(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  const ticketId = parseTicketId(id);
  if (ticketId === null) {
    return NextResponse.json({ error: "无效的工单 ID" }, { status: 400 });
  }

  const ticket = await getTicketById(ticketId);
  if (!ticket) {
    return NextResponse.json({ error: "工单不存在" }, { status: 404 });
  }

  return NextResponse.json({ ticket });
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const { id } = await params;
  const ticketId = parseTicketId(id);
  if (ticketId === null) {
    return NextResponse.json({ error: "无效的工单 ID" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const ticket = await getTicketById(ticketId);
  if (!ticket) {
    return NextResponse.json({ error: "工单不存在" }, { status: 404 });
  }

  const identity = await getIdentityFromCookie();
  const isCreator = user.id === ticket.creator_id;
  const isAssignee = user.id === ticket.assignee_id;
  const isAdmin = identity?.role === "管理员";

  if (!isCreator && !isAssignee && !isAdmin) {
    return NextResponse.json({ error: "无权编辑此工单" }, { status: 403 });
  }

  const body = (await request.json()) as {
    severity?: Severity;
    specialty_type?: SpecialtyType;
    description?: string;
    location?: string;
    detail?: string;
    images?: string[];
  };

  const updatedTicket = await updateTicket(ticketId, body);
  if (!updatedTicket) {
    return NextResponse.json({ error: "工单更新失败" }, { status: 500 });
  }

  return NextResponse.json({ ticket: updatedTicket });
}
