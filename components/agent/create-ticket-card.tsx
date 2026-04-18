"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface CreateTicketCardProps {
  args?: {
    description?: string;
    location?: string;
    severity?: string;
    specialtyType?: string;
  };
}

export function CreateTicketCard({ args }: CreateTicketCardProps) {
  return (
    <div className="bg-card my-2 rounded-lg border p-3 text-sm shadow-sm">
      <div className="flex items-center gap-2">
        <Badge>建单草稿</Badge>
        <span className="text-muted-foreground text-xs">
          请确认以下信息后提交
        </span>
      </div>
      <dl className="mt-3 space-y-1.5 text-sm">
        <Row label="问题描述" value={args?.description} />
        <Row label="位置" value={args?.location} />
        <Row label="严重程度" value={args?.severity} />
        <Row label="专业类型" value={args?.specialtyType} />
      </dl>
      <div className="mt-3 flex justify-end">
        <Button size="sm" type="button">
          提交工单
        </Button>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex items-start gap-2">
      <dt className="text-muted-foreground w-16 shrink-0">{label}</dt>
      <dd className="flex-1 whitespace-pre-wrap">
        {value?.trim() ? (
          value
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </dd>
    </div>
  );
}
