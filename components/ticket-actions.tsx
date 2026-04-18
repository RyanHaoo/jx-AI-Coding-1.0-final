"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { TicketWithRelations } from "@/lib/tickets";
import type { Role } from "@/lib/types";

interface TicketActionsProps {
  ticket: TicketWithRelations;
  userIdentity: {
    userId: string;
    role: Role;
  };
}

type Action = "resolve" | "reject" | "reopen";

export function TicketActions({ ticket, userIdentity }: TicketActionsProps) {
  const [loading, setLoading] = useState<Action | null>(null);
  const router = useRouter();

  const isCreator = userIdentity.userId === ticket.creator_id;
  const isAssignee = userIdentity.userId === ticket.assignee_id;
  const isAdmin = userIdentity.role === "管理员";

  const canResolve = (isAssignee || isAdmin) && ticket.status === "待处理";
  const canReject = (isAssignee || isAdmin) && ticket.status === "待处理";
  const canReopen =
    (isCreator || isAdmin) &&
    (ticket.status === "已完成" || ticket.status === "已拒绝");

  async function handleAction(action: Action) {
    setLoading(action);
    try {
      const res = await fetch(`/api/tickets/${ticket.id}/actions/${action}`, {
        method: "POST",
      });
      if (res.ok) {
        router.refresh();
      }
    } finally {
      setLoading(null);
    }
  }

  const buttons: {
    action: Action;
    label: string;
    visible: boolean;
    variant: string;
  }[] = [
    {
      action: "resolve",
      label: "解决",
      visible: canResolve,
      variant: "bg-primary text-primary-foreground",
    },
    {
      action: "reject",
      label: "拒绝",
      visible: canReject,
      variant: "bg-destructive/10 text-destructive",
    },
    {
      action: "reopen",
      label: "重新打开",
      visible: canReopen,
      variant: "bg-secondary text-secondary-foreground",
    },
  ];

  const visibleButtons = buttons.filter((b) => b.visible);
  if (visibleButtons.length === 0) return null;

  return (
    <div className="flex gap-3">
      {visibleButtons.map((btn) => (
        <button
          key={btn.action}
          type="button"
          className={`rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50 ${btn.variant}`}
          onClick={() => handleAction(btn.action)}
          disabled={loading !== null}
        >
          {loading === btn.action ? "处理中..." : btn.label}
        </button>
      ))}
    </div>
  );
}
