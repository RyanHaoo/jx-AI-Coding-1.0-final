import { NextResponse } from "next/server";
import { getIdentityFromCookie } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getTicketById, updateTicketStatus } from "@/lib/tickets";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const ticketId = Number(id);

  if (Number.isNaN(ticketId)) {
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
  const isAssignee = user.id === ticket.assignee_id;
  const isAdmin = identity?.role === "管理员";

  if (!isAssignee && !isAdmin) {
    return NextResponse.json({ error: "无权执行此操作" }, { status: 403 });
  }

  if (ticket.status !== "待处理") {
    return NextResponse.json(
      { error: "工单状态不允许此操作" },
      { status: 409 },
    );
  }

  const updatedTicket = await updateTicketStatus(ticketId, "已完成");
  if (!updatedTicket) {
    return NextResponse.json({ error: "状态更新失败" }, { status: 500 });
  }

  return NextResponse.json({ ticket: updatedTicket });
}
