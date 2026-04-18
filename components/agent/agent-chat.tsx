"use client";

import { HumanMessage } from "@langchain/core/messages";
import {
  type FormEvent,
  Fragment,
  useCallback,
  useMemo,
  useState,
} from "react";

import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputBody,
  type PromptInputMessage,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { InputGroupAddon } from "@/components/ui/input-group";

import { CreateTicketCard } from "./create-ticket-card";
import { ToolCallCard } from "./tool-call-card";
import { useAgentChat } from "./use-agent-chat";

interface AgentChatProps {
  userId: string;
  initialMessages?: unknown[];
}

type ToolCall = {
  id?: string;
  name?: string;
  args?: Record<string, unknown>;
};

type ChatMessage = {
  id?: string;
  type?: string;
  role?: string;
  content?: unknown;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
  name?: string;
};

type Role = "user" | "assistant" | "system" | "tool" | "other";

function getRole(msg: ChatMessage): Role {
  const t = (msg.type ?? msg.role ?? "").toLowerCase();
  if (t === "human" || t === "user") return "user";
  if (t === "ai" || t === "assistant") return "assistant";
  if (t === "system") return "system";
  if (t === "tool") return "tool";
  return "other";
}

function getText(content: unknown): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "string") return part;
        if (part && typeof part === "object" && "text" in part) {
          const text = (part as { text?: unknown }).text;
          return typeof text === "string" ? text : "";
        }
        return "";
      })
      .join("");
  }
  return "";
}

export function AgentChat({ userId, initialMessages }: AgentChatProps) {
  const { messages, submit, isLoading, error, stop } = useAgentChat({
    userId,
    initialMessages,
  });
  const [input, setInput] = useState("");

  const handleSubmit = useCallback(
    (message: PromptInputMessage, event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const text = message.text.trim();
      if (!text || isLoading) return;

      const human = new HumanMessage({ content: text });
      const prev = (messages ?? []) as unknown[];

      submit(
        { messages: [human] },
        {
          optimisticValues: { messages: [...prev, human] as never },
          config: { configurable: { thread_id: userId } },
        },
      );
      setInput("");
    },
    [submit, messages, isLoading, userId],
  );

  const sourceMessages =
    messages && messages.length > 0
      ? ((messages ?? []) as ChatMessage[])
      : ((initialMessages ?? []) as ChatMessage[]);

  const toolResultById = useMemo(() => {
    const map = new Map<string, ChatMessage>();
    for (const m of sourceMessages) {
      if (getRole(m) === "tool" && m.tool_call_id) {
        map.set(m.tool_call_id, m);
      }
    }
    return map;
  }, [sourceMessages]);

  const items = sourceMessages.filter((m) => {
    const role = getRole(m);
    return role === "user" || role === "assistant";
  });

  return (
    <div className="flex h-full min-h-0 flex-col">
      <Conversation>
        <ConversationContent>
          {items.length === 0 ? (
            <ConversationEmptyState
              title="你好，我是你的智能助手"
              description="有什么可以帮你的？例如查询工单、咨询规范，或提交新的质检问题。"
            />
          ) : (
            items.map((msg, index) => {
              const role = getRole(msg);
              const text = getText(msg.content);
              const toolCalls = Array.isArray(msg.tool_calls)
                ? msg.tool_calls
                : [];
              const key = msg.id ?? `${role}-${index}`;

              if (role === "user") {
                if (!text) return null;
                return (
                  <Message key={key} from="user">
                    <MessageContent>
                      <span className="whitespace-pre-wrap">{text}</span>
                    </MessageContent>
                  </Message>
                );
              }

              const hasCards = toolCalls.length > 0;
              if (!text && !hasCards) return null;

              return (
                <Fragment key={key}>
                  {hasCards ? (
                    <div className="w-full">
                      {toolCalls.map((tc, i) => {
                        const tcKey = tc.id ?? `${key}-tc-${i}`;
                        const result = tc.id
                          ? toolResultById.get(tc.id)
                          : undefined;
                        const status: "running" | "done" = result
                          ? "done"
                          : "running";
                        if (tc.name === "create_ticket") {
                          return (
                            <CreateTicketCard
                              key={tcKey}
                              args={
                                tc.args as {
                                  description?: string;
                                  location?: string;
                                  severity?: string;
                                  specialtyType?: string;
                                }
                              }
                            />
                          );
                        }
                        return (
                          <ToolCallCard
                            key={tcKey}
                            name={tc.name ?? "tool"}
                            status={status}
                            result={getText(result?.content)}
                          />
                        );
                      })}
                    </div>
                  ) : null}
                  {text ? (
                    <Message from="assistant">
                      <MessageContent>
                        <MessageResponse>{text}</MessageResponse>
                      </MessageContent>
                    </Message>
                  ) : null}
                </Fragment>
              );
            })
          )}

          {error ? (
            <p className="text-destructive text-sm">
              出错了：{error instanceof Error ? error.message : String(error)}
            </p>
          ) : null}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="border-t p-3">
        <PromptInput onSubmit={handleSubmit}>
          <PromptInputBody>
            <PromptInputTextarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="输入消息，Enter 发送…"
              disabled={isLoading}
            />
            <InputGroupAddon align="inline-end">
              <PromptInputSubmit
                status={isLoading ? "streaming" : undefined}
                onStop={stop}
                disabled={!input.trim() && !isLoading}
              />
            </InputGroupAddon>
          </PromptInputBody>
        </PromptInput>
      </div>
    </div>
  );
}
