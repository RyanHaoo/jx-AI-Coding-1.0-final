import {
  APIUserAbortError,
  ChatEventType,
  CozeAPI,
  RoleType,
  type StreamChatData,
} from "@coze/api";

type AskCozeKnowledgeParams = {
  question: string;
  userId: string;
  signal?: AbortSignal;
};

const COZE_BASE_URL = process.env.COZE_BASE_URL || "https://api.coze.cn";
const COZE_BOT_ID = process.env.COZE_BOT_ID || "";
const COZE_API_TOKEN = process.env.COZE_API_TOKEN || "";

function getConfigError(): string | null {
  if (!COZE_API_TOKEN) {
    return "知识库服务未配置访问凭证，请联系管理员。";
  }
  if (!COZE_BOT_ID) {
    return "知识库服务未配置机器人，请联系管理员。";
  }
  return null;
}

function normalizeCozeError(error: unknown): string {
  if (error instanceof APIUserAbortError) {
    return "知识库查询已取消。";
  }
  if (
    typeof error === "object" &&
    error &&
    "name" in error &&
    error.name === "AbortError"
  ) {
    return "知识库查询已取消。";
  }

  const message = error instanceof Error ? error.message.toLowerCase() : "";
  if (
    message.includes("unauthorized") ||
    message.includes("forbidden") ||
    message.includes("401") ||
    message.includes("403")
  ) {
    return "知识库服务鉴权失败，请稍后重试。";
  }
  if (message.includes("timeout") || message.includes("timed out")) {
    return "知识库响应超时，请稍后重试。";
  }
  return "知识库服务暂时不可用，请稍后再试。";
}

function collectFinalAnswer(streamChunk: StreamChatData): string | null {
  if (streamChunk.event !== ChatEventType.CONVERSATION_MESSAGE_COMPLETED) {
    return null;
  }
  if (
    streamChunk.data.role === RoleType.Assistant &&
    streamChunk.data.type === "answer" &&
    streamChunk.data.content
  ) {
    return streamChunk.data.content;
  }
  return null;
}

export async function askCozeKnowledge({
  question,
  userId,
  signal,
}: AskCozeKnowledgeParams): Promise<string> {
  const configError = getConfigError();
  if (configError) return configError;
  if (signal?.aborted) return "知识库查询已取消。";

  const client = new CozeAPI({
    token: COZE_API_TOKEN,
    baseURL: COZE_BASE_URL,
  });

  try {
    const stream = await client.chat.stream(
      {
        bot_id: COZE_BOT_ID,
        user_id: userId,
        additional_messages: [
          {
            role: RoleType.User,
            content: question,
            content_type: "text",
            type: "question",
          },
        ],
      },
      { signal },
    );

    const answers: string[] = [];

    for await (const chunk of stream) {
      const finalAnswer = collectFinalAnswer(chunk);
      if (finalAnswer) {
        answers.push(finalAnswer);
      }
      if (chunk.event === ChatEventType.ERROR) {
        return `知识库服务返回错误：${chunk.data.msg}`;
      }
    }

    if (answers.length === 0) {
      return "知识库暂未返回有效答案，请稍后重试。";
    }
    return answers.join("\n\n").trim();
  } catch (error) {
    return normalizeCozeError(error);
  }
}
