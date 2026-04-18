import path from "node:path";
import type { StructuredToolInterface } from "@langchain/core/tools";
import { MultiServerMCPClient } from "@langchain/mcp-adapters";

let mcpClientPromise: Promise<MultiServerMCPClient> | null = null;
let queryToolPromise: Promise<StructuredToolInterface> | null = null;

function getChildProcessEnv(): Record<string, string> {
  return Object.fromEntries(
    Object.entries(process.env).filter(([, value]) => value !== undefined),
  ) as Record<string, string>;
}

async function createMcpClient(): Promise<MultiServerMCPClient> {
  return new MultiServerMCPClient({
    ticketQuery: {
      transport: "stdio",
      command: "node",
      args: [path.resolve(process.cwd(), "mcp/ticket-query-server.mjs")],
      env: getChildProcessEnv(),
    },
  });
}

export async function getMcpClient(): Promise<MultiServerMCPClient> {
  if (!mcpClientPromise) {
    mcpClientPromise = createMcpClient();
  }
  return mcpClientPromise;
}

export async function getQueryTicketMcpTool(): Promise<StructuredToolInterface> {
  if (!queryToolPromise) {
    queryToolPromise = (async () => {
      const client = await getMcpClient();
      const tools = await client.getTools();
      const queryTool = tools.find((t) => t.name === "query_ticket");
      if (!queryTool) {
        throw new Error("MCP tool query_ticket not found");
      }
      return queryTool;
    })();
  }
  return queryToolPromise;
}
