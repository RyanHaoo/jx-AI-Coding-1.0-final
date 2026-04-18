import type { RunnableConfig } from "@langchain/core/runnables";
import { tool } from "langchain";
import { z } from "zod";
import { askCozeKnowledge } from "./coze-client";
import { getQueryTicketMcpTool } from "./mcp-client";

type QueryTicketItem = {
  id: number;
  status: string;
  severity: string;
  description: string;
  location: string;
  created_at: string;
  assignee_name: string;
  project_name: string;
};

type QueryTicketPayload = {
  items?: QueryTicketItem[];
  total?: number;
  truncated?: boolean;
  error?: { code?: string; message?: string };
};

function mapMcpErrorToReply(raw: string): string {
  try {
    const parsed = JSON.parse(raw) as QueryTicketPayload;
    const code = parsed.error?.code;
    if (code === "UNAUTHENTICATED") {
      return "请重新登录后再试";
    }
    if (code === "INVALID_ARGUMENT") {
      return "查询参数无效，请换个条件试试";
    }
    if (code === "QUERY_FAILED") {
      return "查询失败，请稍后重试";
    }
  } catch {
    return raw;
  }
  return raw;
}

function formatQueryTicketResult(raw: string): string {
  let parsed: QueryTicketPayload;
  try {
    parsed = JSON.parse(raw) as QueryTicketPayload;
  } catch {
    return raw;
  }

  if (parsed.error?.code) {
    return mapMcpErrorToReply(raw);
  }

  const items = Array.isArray(parsed.items) ? parsed.items : [];
  if (items.length === 0) {
    return "当前没有符合条件的工单。";
  }

  const lines = items.map((item) => {
    const link = `/mobile/tickets/${item.id}`;
    return `- [工单 #${item.id}](${link})｜状态：${item.status}｜严重度：${item.severity}｜位置：${item.location}｜问题：${item.description}`;
  });

  const total = typeof parsed.total === "number" ? parsed.total : items.length;
  const header = `已查询到 ${total} 条工单，当前展示 ${items.length} 条：`;
  const truncatedNote = parsed.truncated
    ? "\n结果已截断，如需更精确结果请继续细化筛选条件。"
    : "";

  return `${header}\n${lines.join("\n")}${truncatedNote}`;
}

function readAccessToken(config?: RunnableConfig): string {
  const configurable = (config?.configurable ?? {}) as {
    supabase_access_token?: string;
  };
  return configurable.supabase_access_token ?? "";
}

export const queryTicket = tool(
  async (input, config?: RunnableConfig) => {
    const mcpTool = await getQueryTicketMcpTool();
    const accessToken = readAccessToken(config);
    const response = await mcpTool.invoke({
      ...input,
      supabase_access_token: accessToken,
    });
    const text =
      typeof response === "string" ? response : JSON.stringify(response);
    return formatQueryTicketResult(text);
  },
  {
    name: "queryTicket",
    description:
      "查询当前项目下的工单列表。当用户想看/查询/找工单时调用。支持状态、严重程度、专业类型、关键字和数量限制。",
    schema: z.object({
      status: z.enum(["待处理", "已完成", "已拒绝"]).optional(),
      severity: z.enum(["轻微", "一般", "严重", "紧急"]).optional(),
      specialty_type: z
        .enum(["建筑设计专业", "结构专业", "给排水专业"])
        .optional(),
      keyword: z.string().optional().describe("可选关键字，匹配描述或位置"),
      limit: z
        .number()
        .int()
        .min(1)
        .max(50)
        .optional()
        .describe("可选返回条数，默认 10，上限 50"),
    }),
  },
);

export const consultConstructionKnowledge = tool(
  async ({ question }, config?: RunnableConfig) => {
    const threadId = config?.configurable?.thread_id;
    const userId = typeof threadId === "string" ? threadId : "";

    return askCozeKnowledge({
      question,
      userId,
      signal: config?.signal,
    });
  },
  {
    name: "consult_construction_knowledge",
    description:
      "检索建筑施工质检知识库。当用户咨询施工规范、做法、验收标准、质量要求等知识问题时调用。参数 question 为用户原始问题。",
    schema: z.object({
      question: z.string().describe("用户的原始知识问题"),
    }),
  },
);

// HITL 占位：create_ticket 并不在此处真正建单，而是通知前端渲染确认卡片。
// 返回值会作为 ToolMessage 写入对话历史，仅用于让 Agent 知道「已发起 HITL，等待用户在前端确认」。
export const createTicket = tool(
  async () => "pending_user_confirmation: 等待用户在前端卡片中确认后提交",
  {
    name: "create_ticket",
    description:
      "创建一条工单草稿。仅当用户明确希望报事 / 创建工单 / 记录问题时调用。仅质检员可调用；其他角色必须拒绝。调用前应尽量从上下文抽取 description / location / severity / specialtyType 参数；缺失时模型应先向用户追问，而不是贸然调用此工具。",
    schema: z.object({
      description: z.string().describe("问题描述"),
      location: z.string().describe("问题位置（如 3 号楼 5 层卫生间）"),
      severity: z
        .enum(["轻微", "一般", "严重", "紧急"])
        .optional()
        .describe("严重程度"),
      specialtyType: z
        .enum(["建筑设计专业", "结构专业", "给排水专业"])
        .optional()
        .describe("专业类型"),
    }),
  },
);

export const allTools = [
  queryTicket,
  consultConstructionKnowledge,
  createTicket,
];
