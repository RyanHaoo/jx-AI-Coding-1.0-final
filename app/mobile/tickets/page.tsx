"use client";

import { useEffect, useState } from "react";
import type { TicketWithRelations } from "@/lib/tickets";

export default function TicketsPage() {
  const [tickets, setTickets] = useState<TicketWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadTickets() {
      try {
        const response = await fetch("/api/tickets", {
          method: "GET",
          cache: "no-store",
        });
        const payload = (await response.json()) as
          | { tickets: TicketWithRelations[] }
          | { error: string };

        if (!response.ok || !("tickets" in payload)) {
          setError("加载工单失败");
          return;
        }

        setTickets(payload.tickets);
      } catch {
        setError("加载工单失败");
      } finally {
        setLoading(false);
      }
    }

    void loadTickets();
  }, []);

  return (
    <div>
      <h2 className="text-lg font-medium">工单列表</h2>
      {loading && (
        <p className="mt-2 text-sm text-muted-foreground">加载中...</p>
      )}
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
      {!loading && !error && tickets.length === 0 && (
        <p className="mt-2 text-sm text-muted-foreground">暂无工单</p>
      )}
      {!loading && !error && tickets.length > 0 && (
        <ul className="mt-3 space-y-2">
          {tickets.map((ticket) => (
            <li key={ticket.id} className="rounded-md border p-3 text-sm">
              <p className="font-medium">{ticket.description}</p>
              <p className="text-muted-foreground mt-1">
                #{ticket.id} · {ticket.status} · {ticket.severity}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
