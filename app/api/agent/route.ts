import {
  coerceMessageLikeToMessage,
  SystemMessage,
} from "@langchain/core/messages";
import { Command } from "@langchain/langgraph";
import type { NextRequest } from "next/server";

import { agent, pruneThreadIfExceeded } from "@/lib/agent";
import { ensureCheckpointerReady } from "@/lib/agent/checkpoints";
import {
  buildSystemPrompt,
  type IdentityContextForPrompt,
  SYSTEM_PROMPT_ID,
} from "@/lib/agent/prompts";
import { getIdentityFromCookie } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AgentRequestBody = {
  input?: { messages?: unknown[] } | null;
  messages?: unknown[];
  command?: { resume?: unknown } | null;
  config?: { configurable?: { thread_id?: string } } | null;
};

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return new Response(JSON.stringify({ error: "unauthenticated" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const identityCookie = await getIdentityFromCookie();

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, department")
    .eq("id", user.id)
    .single();

  const identity: IdentityContextForPrompt | null = identityCookie
    ? {
        userId: user.id,
        name: profile?.name ?? "",
        department: profile?.department ?? "",
        role: identityCookie.role,
        projectId: identityCookie.projectId,
        projectName: identityCookie.projectName,
      }
    : null;

  let body: AgentRequestBody;
  try {
    body = (await req.json()) as AgentRequestBody;
  } catch {
    return new Response(JSON.stringify({ error: "invalid_json" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const threadId = user.id;

  await ensureCheckpointerReady();
  await pruneThreadIfExceeded(threadId);

  const rawMessages = Array.isArray(body?.input?.messages)
    ? (body.input?.messages as unknown[])
    : Array.isArray(body?.messages)
      ? (body.messages as unknown[])
      : [];

  const systemPromptContent = buildSystemPrompt(identity);
  const systemMessage = new SystemMessage({
    id: SYSTEM_PROMPT_ID,
    content: systemPromptContent,
  });

  const streamInput =
    body?.command?.resume !== undefined
      ? new Command({ resume: body.command.resume })
      : {
          messages: [
            systemMessage,
            ...rawMessages.map((m) =>
              coerceMessageLikeToMessage(
                m as Parameters<typeof coerceMessageLikeToMessage>[0],
              ),
            ),
          ],
        };

  const stream = await agent.stream(streamInput, {
    encoding: "text/event-stream",
    streamMode: ["messages", "values", "updates"],
    signal: req.signal,
    configurable: { thread_id: threadId },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
