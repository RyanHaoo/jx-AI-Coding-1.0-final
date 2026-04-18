import { redirect } from "next/navigation";

import { AgentChat } from "@/components/agent/agent-chat";
import { getThreadMessages } from "@/lib/agent";
import { ensureCheckpointerReady } from "@/lib/agent/checkpoints";
import { getIdentitiesForUser, getIdentityFromCookie } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AssistantPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  let initialMessages: Awaited<ReturnType<typeof getThreadMessages>> = [];
  try {
    await ensureCheckpointerReady();
    initialMessages = await getThreadMessages(user.id);
  } catch {
    initialMessages = [];
  }

  const cookieIdentity = await getIdentityFromCookie();
  const identities = await getIdentitiesForUser(user.id);
  const projectId =
    cookieIdentity?.projectId ?? identities[0]?.projectId ?? undefined;

  return (
    <div className="flex h-[calc(100dvh-8rem)] flex-col">
      <h2 className="px-3 py-2 text-lg font-medium">智能助手</h2>
      <div className="min-h-0 flex-1">
        <AgentChat
          userId={user.id}
          initialMessages={initialMessages}
          projectId={projectId}
        />
      </div>
    </div>
  );
}
