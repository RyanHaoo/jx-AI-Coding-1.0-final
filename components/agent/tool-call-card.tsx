"use client";

import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";

interface ToolCallCardProps {
  name: string;
  status: "running" | "done";
  result?: string;
}

const TOOL_LABELS: Record<string, string> = {
  queryTicket: "查询工单",
  knowledge_query: "知识库检索",
  create_ticket: "创建工单草稿",
};

export function ToolCallCard({ name, status, result }: ToolCallCardProps) {
  const label = TOOL_LABELS[name] ?? name;
  return (
    <div className="bg-muted/40 my-2 rounded-lg border p-3 text-sm">
      <div className="flex items-center gap-2">
        <Badge variant="secondary">{label}</Badge>
        {status === "running" ? (
          <span className="text-muted-foreground flex items-center gap-1 text-xs">
            <Spinner className="size-3" />
            调用中…
          </span>
        ) : (
          <span className="text-muted-foreground text-xs">已完成</span>
        )}
      </div>
      {status === "done" && result ? (
        <pre className="text-muted-foreground mt-2 text-xs whitespace-pre-wrap">
          {result}
        </pre>
      ) : null}
    </div>
  );
}
