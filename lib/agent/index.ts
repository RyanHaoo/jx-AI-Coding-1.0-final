import type { BaseMessage } from "@langchain/core/messages";
import { RemoveMessage } from "@langchain/core/messages";
import { toMessageDict } from "@langchain/langgraph-sdk/ui";
import { createAgent } from "langchain";
import { getCheckpointer } from "./checkpoints";
import { model } from "./model";
import { allTools } from "./tools";

export type AgentMessageDict = ReturnType<typeof toMessageDict>;

function createLangAgent() {
  return createAgent({
    model,
    tools: allTools,
    checkpointer: getCheckpointer(),
  });
}

let agentPromise: Promise<ReturnType<typeof createLangAgent>> | null = null;

async function getAgent() {
  if (!agentPromise) {
    agentPromise = Promise.resolve(createLangAgent());
  }
  return agentPromise;
}

export async function streamAgent(
  input: Parameters<ReturnType<typeof createLangAgent>["stream"]>[0],
  options: Parameters<ReturnType<typeof createLangAgent>["stream"]>[1],
) {
  const agent = await getAgent();
  return agent.stream(input, options);
}

const MAX_ROUNDS = 6;

type ThreadMessage = { id?: string; type?: string; role?: string };

function isHumanLike(msg: ThreadMessage): boolean {
  const t = (msg.type ?? msg.role ?? "").toLowerCase();
  return t === "human" || t === "user";
}

export function trimToLastNRounds<T extends ThreadMessage>(
  messages: T[],
  n: number = MAX_ROUNDS,
): T[] {
  let humanCount = 0;
  for (let i = messages.length - 1; i >= 0; i--) {
    if (isHumanLike(messages[i])) {
      humanCount += 1;
      if (humanCount === n) {
        return messages.slice(i);
      }
    }
  }
  return messages;
}

type SnapshotValues = { messages?: BaseMessage[] } | undefined;

async function readMessages(threadId: string): Promise<BaseMessage[]> {
  try {
    const agent = await getAgent();
    const snapshot = (await agent.getState({
      configurable: { thread_id: threadId },
    })) as { values?: SnapshotValues } | null;
    return snapshot?.values?.messages ?? [];
  } catch {
    return [];
  }
}

export async function getThreadMessages(
  threadId: string,
): Promise<AgentMessageDict[]> {
  const messages = await readMessages(threadId);
  return trimToLastNRounds(messages).map((m) => toMessageDict(m));
}

export async function pruneThreadIfExceeded(threadId: string): Promise<void> {
  const messages = await readMessages(threadId);
  if (messages.length === 0) return;

  const keep = new Set(trimToLastNRounds(messages).map((m) => m.id));
  const toRemove = messages
    .filter((m) => m.id && !keep.has(m.id))
    .map((m) => new RemoveMessage({ id: m.id as string }));
  if (toRemove.length > 0) {
    const agent = await getAgent();
    await agent.updateState(
      { configurable: { thread_id: threadId } },
      { messages: toRemove },
    );
  }
}
