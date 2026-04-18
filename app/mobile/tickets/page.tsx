"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { TicketListItem } from "@/components/ticket-list-item";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { TicketWithRelations } from "@/lib/tickets";

type TabValue = "pending" | "closed" | "all";

function matchesTab(status: TicketWithRelations["status"], tab: TabValue) {
  if (tab === "all") return true;
  if (tab === "pending") return status === "待处理";
  return status === "已完成" || status === "已拒绝";
}

export default function TicketsPage() {
  const [tickets, setTickets] = useState<TicketWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabValue>("pending");

  const loadTickets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/tickets", {
        method: "GET",
        cache: "no-store",
      });
      const payload = (await response.json()) as
        | { tickets: TicketWithRelations[] }
        | { error: string };

      if (!response.ok || !("tickets" in payload)) {
        setError("加载工单失败，请稍后重试");
        return;
      }

      setTickets(payload.tickets);
    } catch {
      setError("加载工单失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTickets();
  }, [loadTickets]);

  const display = useMemo(() => {
    const filtered = tickets.filter((t) => matchesTab(t.status, activeTab));
    const urgent = filtered.filter((t) => t.severity === "紧急");
    const rest = filtered
      .filter((t) => t.severity !== "紧急")
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
    return [...urgent, ...rest];
  }, [tickets, activeTab]);

  return (
    <div className="space-y-3">
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as TabValue)}
      >
        <TabsList>
          <TabsTrigger value="pending">待处理</TabsTrigger>
          <TabsTrigger value="closed">已结束</TabsTrigger>
          <TabsTrigger value="all">全部</TabsTrigger>
        </TabsList>
      </Tabs>

      {loading && <p className="text-sm text-muted-foreground">加载中...</p>}

      {error && (
        <div className="flex flex-col gap-2 rounded-lg border border-destructive/40 bg-destructive/5 p-3">
          <p className="text-sm text-destructive">{error}</p>
          <Button
            variant="outline"
            size="sm"
            className="self-start"
            onClick={() => void loadTickets()}
          >
            重试
          </Button>
        </div>
      )}

      {!loading && !error && display.length === 0 && (
        <div className="flex flex-col items-center gap-1 py-10 text-center">
          <p className="text-sm font-medium text-foreground">暂无工单</p>
          <p className="text-xs text-muted-foreground">
            当前筛选条件下没有工单
          </p>
        </div>
      )}

      {!loading && !error && display.length > 0 && (
        <ul className="space-y-2">
          {display.map((ticket) => (
            <li key={ticket.id}>
              <TicketListItem ticket={ticket} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
