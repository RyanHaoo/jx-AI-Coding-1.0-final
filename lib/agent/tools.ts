import { tool } from "langchain";
import { z } from "zod";

const MOCK_SUCCESS = "mock success";

export const queryTicket = tool(async () => MOCK_SUCCESS, {
  name: "queryTicket",
  description:
    "查询当前项目下的工单列表。当用户想看/查询/找工单时调用。参数 filter 为可选过滤条件（如状态、严重程度、责任人等的自然语言描述）。",
  schema: z.object({
    filter: z.string().optional().describe("可选的过滤条件，自然语言"),
  }),
});

export const knowledgeQuery = tool(async () => MOCK_SUCCESS, {
  name: "knowledge_query",
  description:
    "检索建筑施工质检知识库。当用户咨询规范 / 做法 / 标准等知识类问题时调用。参数 question 为用户原始问题。",
  schema: z.object({
    question: z.string().describe("用户的原始问题"),
  }),
});

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

export const allTools = [queryTicket, knowledgeQuery, createTicket];
