"use client";

import type { BaseMessage } from "@langchain/core/messages";
import { FetchStreamTransport, useStream } from "@langchain/react";
import { useMemo } from "react";

export interface UseAgentChatOptions {
  userId: string;
  initialMessages?: unknown[];
}

export function useAgentChat({ userId, initialMessages }: UseAgentChatOptions) {
  const transport = useMemo(
    () =>
      new FetchStreamTransport({
        apiUrl: "/api/agent",
      }),
    [],
  );

  const initialValues = useMemo(() => {
    if (!initialMessages || initialMessages.length === 0) return undefined;
    return { messages: initialMessages as unknown as BaseMessage[] };
  }, [initialMessages]);

  return useStream({
    transport,
    throttle: 50,
    threadId: userId,
    initialValues,
  });
}
