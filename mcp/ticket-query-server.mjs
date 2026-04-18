import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { createClient } from "@supabase/supabase-js";

const TOOL_NAME = "query_ticket";
const STATUS_VALUES = ["待处理", "已完成", "已拒绝"];
const SEVERITY_VALUES = ["轻微", "一般", "严重", "紧急"];
const SPECIALTY_VALUES = ["建筑设计专业", "结构专业", "给排水专业"];
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

const RELATION_FIELDS = `
  id,
  status,
  severity,
  description,
  location,
  created_at,
  assignee:profiles!assignee_id (name),
  project:projects!project_id (name)
`;

const server = new Server(
  { name: "ticket-query-server", version: "0.1.0" },
  { capabilities: { tools: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: TOOL_NAME,
      description:
        "查询当前登录用户权限范围内的工单列表，支持状态/严重程度/专业/关键字过滤。",
      inputSchema: {
        type: "object",
        properties: {
          status: {
            type: "string",
            enum: STATUS_VALUES,
            description: "可选工单状态",
          },
          severity: {
            type: "string",
            enum: SEVERITY_VALUES,
            description: "可选严重程度",
          },
          specialty_type: {
            type: "string",
            enum: SPECIALTY_VALUES,
            description: "可选专业类型",
          },
          keyword: {
            type: "string",
            description: "可选关键字，匹配描述和位置",
          },
          limit: {
            type: "number",
            description: "可选返回条数，默认 10，上限 50",
          },
          supabase_access_token: {
            type: "string",
            description: "运行时注入 token，模型不可见",
          },
        },
        required: ["supabase_access_token"],
      },
    },
  ],
}));

function normalizeLimit(value) {
  const parsed = Number.isFinite(value) ? Number(value) : DEFAULT_LIMIT;
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_LIMIT;
  return Math.min(MAX_LIMIT, Math.trunc(parsed));
}

function invalidArgument(message) {
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify({
          error: { code: "INVALID_ARGUMENT", message },
        }),
      },
    ],
  };
}

function extractName(rel) {
  if (Array.isArray(rel)) return rel[0]?.name ?? "";
  return rel?.name ?? "";
}

server.setRequestHandler(CallToolRequestSchema, async ({ params }) => {
  if (params.name !== TOOL_NAME) {
    return invalidArgument(`Unsupported tool: ${params.name}`);
  }

  const args = params.arguments ?? {};
  const token =
    typeof args.supabase_access_token === "string"
      ? args.supabase_access_token
      : "";
  if (!token) {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            error: {
              code: "UNAUTHENTICATED",
              message: "缺少登录态，请重新登录",
            },
          }),
        },
      ],
    };
  }

  const status = typeof args.status === "string" ? args.status : undefined;
  const severity =
    typeof args.severity === "string" ? args.severity : undefined;
  const specialtyType =
    typeof args.specialty_type === "string" ? args.specialty_type : undefined;
  const keyword = typeof args.keyword === "string" ? args.keyword.trim() : "";
  const limit = normalizeLimit(args.limit);

  if (status && !STATUS_VALUES.includes(status)) {
    return invalidArgument(
      `status must be one of: ${STATUS_VALUES.join(", ")}`,
    );
  }
  if (severity && !SEVERITY_VALUES.includes(severity)) {
    return invalidArgument(
      `severity must be one of: ${SEVERITY_VALUES.join(", ")}`,
    );
  }
  if (specialtyType && !SPECIALTY_VALUES.includes(specialtyType)) {
    return invalidArgument(
      `specialty_type must be one of: ${SPECIALTY_VALUES.join(", ")}`,
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabasePublishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const supabaseApiKey = supabaseAnonKey ?? supabasePublishableKey;
  if (!supabaseUrl || !supabaseApiKey) {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            error: { code: "QUERY_FAILED", message: "Supabase 环境变量未配置" },
          }),
        },
      ],
    };
  }

  const supabase = createClient(supabaseUrl, supabaseApiKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  let query = supabase
    .from("tickets")
    .select(RELATION_FIELDS, { count: "exact" })
    .order("created_at", { ascending: false });

  if (status) query = query.eq("status", status);
  if (severity) query = query.eq("severity", severity);
  if (specialtyType) query = query.eq("specialty_type", specialtyType);
  if (keyword)
    query = query.or(
      `description.ilike.%${keyword}%,location.ilike.%${keyword}%`,
    );

  const { data, error, count } = await query.range(0, limit - 1);
  if (error) {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            error: { code: "QUERY_FAILED", message: "工单查询失败" },
          }),
        },
      ],
    };
  }

  const total = count ?? data?.length ?? 0;
  const items = (data ?? []).map((row) => ({
    id: row.id,
    status: row.status,
    severity: row.severity,
    description: row.description,
    location: row.location,
    created_at: row.created_at,
    assignee_name: extractName(row.assignee),
    project_name: extractName(row.project),
  }));

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify({
          items,
          total,
          truncated: total > items.length,
        }),
      },
    ],
  };
});

await server.connect(new StdioServerTransport());
