import { notFound } from "next/navigation";
import { TicketDetail } from "@/components/ticket-detail";
import { getIdentityFromCookie } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getTicketById } from "@/lib/tickets";

export default async function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ticketId = Number(id);

  const ticket = await getTicketById(ticketId);
  if (!ticket) notFound();

  // Get current user ID + role for permission checks
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const identity = await getIdentityFromCookie();

  const userIdentity = user
    ? { userId: user.id, role: identity?.role ?? ("质检员" as const) }
    : null;

  return <TicketDetail ticket={ticket} userIdentity={userIdentity} />;
}
