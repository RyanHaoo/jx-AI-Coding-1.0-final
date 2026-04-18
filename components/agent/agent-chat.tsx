"use client";

import { HumanMessage } from "@langchain/core/messages";
import {
  type FormEvent,
  Fragment,
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
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
import {
  normalizeCreateTicketDraftArgs,
  parseToolCallArgsRecord,
} from "@/lib/agent/create-ticket-draft-args";
import { AgentMarkdownAnchor } from "./agent-markdown-anchor";
import {
  CreateTicketCard,
  type CreateTicketSubmitResult,
} from "./create-ticket-card";
import { ToolCallCard } from "./tool-call-card";
import { useAgentChat } from "./use-agent-chat";

const agentMessageMarkdownComponents = {
  a: AgentMarkdownAnchor,
};

interface AgentChatProps {
  userId: string;
  initialMessages?: unknown[];
  /** 用于建单责任人列表；与服务端 cookie 兜底一致 */
  projectId?: number;
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

const HITL_RESULT_PREFIX = "[HITL_RESULT]";
/** matches `max-h-48` (12rem); keep in sync when changing PromptInputTextarea max height */
const CHAT_INPUT_MAX_HEIGHT_PX = 192;

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

function parseHitlResult(text: string): CreateTicketSubmitResult | null {
  if (!text.startsWith(HITL_RESULT_PREFIX)) return null;
  const jsonPart = text.slice(HITL_RESULT_PREFIX.length).trim();
  try {
    const data = JSON.parse(jsonPart) as {
      status?: string;
      ticket_id?: number;
      tool_call_id?: string;
      message?: string;
    };
    if (data.status !== "success" && data.status !== "error") return null;
    return {
      status: data.status,
      ticket_id: data.ticket_id,
      message: data.message,
    };
  } catch {
    return null;
  }
}

function extractToolCallId(text: string): string | null {
  if (!text.startsWith(HITL_RESULT_PREFIX)) return null;
  const jsonPart = text.slice(HITL_RESULT_PREFIX.length).trim();
  try {
    const data = JSON.parse(jsonPart) as { tool_call_id?: string };
    return data.tool_call_id ?? null;
  } catch {
    return null;
  }
}

/** 持久化的 HITL 回传消息在气泡中的展示文案（不写死 JSON） */
function hitlUserBubbleLabel(text: string): string | null {
  const parsed = parseHitlResult(text);
  if (!parsed) return null;
  if (parsed.status === "success") return "已提交";
  const hint = parsed.message?.trim();
  return hint ? `提交失败：${hint}` : "提交失败";
}

function AgentTypingIndicator() {
  return (
    <div aria-live="polite" className="flex justify-start pt-2">
      <span className="sr-only">助手正在回复</span>
      <div
        aria-busy="true"
        className="flex items-center gap-1 rounded-2xl bg-muted px-3 py-2"
      >
        <span className="inline-block size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
        <span className="inline-block size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
        <span className="inline-block size-1.5 animate-bounce rounded-full bg-muted-foreground" />
      </div>
    </div>
  );
}

export function AgentChat({
  userId,
  initialMessages,
  projectId,
}: AgentChatProps) {
  const { messages, submit, isLoading, error, stop } = useAgentChat({
    userId,
    initialMessages,
  });
  const [input, setInput] = useState("");
  const chatTextareaRef = useRef<HTMLTextAreaElement>(null);
  const lastNonEmptyMessagesRef = useRef<ChatMessage[]>([]);

  const syncChatInputHeight = useCallback(() => {
    const el = chatTextareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, CHAT_INPUT_MAX_HEIGHT_PX)}px`;
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: textarea 需在 input 变更（含清空）后重算高度
  useLayoutEffect(() => {
    syncChatInputHeight();
  }, [input, syncChatInputHeight]);

  const streamList = messages ?? [];
  if (streamList.length > 0) {
    lastNonEmptyMessagesRef.current = streamList as ChatMessage[];
  }

  const sourceMessages = useMemo((): ChatMessage[] => {
    const list = messages ?? [];
    if (list.length > 0) return list as ChatMessage[];
    if (lastNonEmptyMessagesRef.current.length > 0) {
      return lastNonEmptyMessagesRef.current;
    }
    return (initialMessages ?? []) as ChatMessage[];
  }, [messages, initialMessages]);

  const handleSubmit = useCallback(
    (message: PromptInputMessage, event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const text = message.text.trim();
      if (!text || isLoading) return;

      const human = new HumanMessage({ content: text });
      const prev = sourceMessages as unknown[];

      submit(
        { messages: [human] },
        {
          optimisticValues: { messages: [...prev, human] as never },
          config: { configurable: { thread_id: userId } },
        },
      );
      setInput("");
    },
    [submit, sourceMessages, isLoading, userId],
  );

  const toolResultById = useMemo(() => {
    const map = new Map<string, ChatMessage>();
    for (const m of sourceMessages) {
      if (getRole(m) === "tool" && m.tool_call_id) {
        map.set(m.tool_call_id, m);
      }
    }
    return map;
  }, [sourceMessages]);

  // Build a map of tool_call_id -> HITL submit result (parsed from user HITL_RESULT messages)
  const hitlResultByToolCallId = useMemo(() => {
    const map = new Map<string, CreateTicketSubmitResult>();
    for (const m of sourceMessages) {
      if (getRole(m) !== "user") continue;
      const text = getText(m.content);
      if (!text.startsWith(HITL_RESULT_PREFIX)) continue;
      const toolCallId = extractToolCallId(text);
      const parsed = parseHitlResult(text);
      if (toolCallId && parsed) {
        map.set(toolCallId, parsed);
      }
    }
    return map;
  }, [sourceMessages]);

  const handleTicketSubmitted = useCallback(
    (toolCallId: string | undefined, result: CreateTicketSubmitResult) => {
      const payload = JSON.stringify({
        ...result,
        tool_call_id: toolCallId,
      });
      const human = new HumanMessage({
        content: `${HITL_RESULT_PREFIX} ${payload}`,
      });
      const prev = sourceMessages as unknown[];
      submit(
        { messages: [human] },
        {
          optimisticValues: { messages: [...prev, human] as never },
          config: { configurable: { thread_id: userId } },
        },
      );
    },
    [submit, sourceMessages, userId],
  );

  const items = sourceMessages.filter((m) => {
    const role = getRole(m);
    if (role === "user") return true;
    return role === "assistant";
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
                if (text.startsWith(HITL_RESULT_PREFIX)) {
                  const label = hitlUserBubbleLabel(text);
                  if (!label) return null;
                  return (
                    <Message key={key} from="user">
                      <MessageContent>
                        <span className="whitespace-pre-wrap">{label}</span>
                      </MessageContent>
                    </Message>
                  );
                }
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
                          const hitlResolved = tc.id
                            ? hitlResultByToolCallId.get(tc.id)
                            : undefined;
                          const parsedArgs = parseToolCallArgsRecord(tc.args);
                          const draftArgs =
                            normalizeCreateTicketDraftArgs(parsedArgs);
                          return (
                            <CreateTicketCard
                              key={tcKey}
                              toolCallId={tc.id}
                              args={draftArgs}
                              projectId={projectId}
                              agentStreaming={isLoading}
                              resolved={hitlResolved ?? null}
                              onSubmitted={(r) =>
                                handleTicketSubmitted(tc.id, r)
                              }
                            />
                          );
                        }
                        const toolName = tc.name ?? "tool";
                        const rawResult =
                          status === "done"
                            ? getText(result?.content)
                            : undefined;
                        const hideToolResult =
                          toolName === "consult_construction_knowledge";

                        return (
                          <ToolCallCard
                            key={tcKey}
                            name={toolName}
                            status={status}
                            result={hideToolResult ? undefined : rawResult}
                          />
                        );
                      })}
                    </div>
                  ) : null}
                  {text ? (
                    <Message from="assistant">
                      <MessageContent>
                        <MessageResponse
                          components={agentMessageMarkdownComponents}
                        >
                          {text}
                        </MessageResponse>
                      </MessageContent>
                    </Message>
                  ) : null}
                </Fragment>
              );
            })
          )}

          {isLoading ? <AgentTypingIndicator /> : null}

          {error ? (
            <p className="text-destructive text-sm">
              出错了：{error instanceof Error ? error.message : String(error)}
            </p>
          ) : null}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="relative z-10 shrink-0 border-t border-border bg-[var(--stitch-surface-container-lowest)] px-3 pb-3 pt-4">
        <PromptInput onSubmit={handleSubmit}>
          <PromptInputBody>
            <PromptInputTextarea
              ref={chatTextareaRef}
              className="min-h-11 max-h-48 overflow-y-auto text-base ![field-sizing:fixed] md:text-sm"
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
              }}
              onInput={syncChatInputHeight}
              placeholder="输入消息，Enter 发送…"
              disabled={isLoading}
            />
            <InputGroupAddon align="inline-end" className="self-end pb-px">
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
