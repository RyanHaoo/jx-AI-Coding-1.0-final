import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { UserAvatarChip } from "@/components/user-avatar-chip";
import type { TicketWithRelations } from "@/lib/tickets";
import type { TicketStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

interface TicketListItemProps {
  ticket: TicketWithRelations;
}

const statusVariantMap: Record<
  TicketStatus,
  "default" | "secondary" | "destructive"
> = {
  待处理: "secondary",
  已完成: "default",
  已拒绝: "destructive",
};

function formatCreatedAt(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function TicketListItem({ ticket }: TicketListItemProps) {
  const isUrgent = ticket.severity === "紧急";
  const firstImage = ticket.images[0];

  return (
    <Link
      href={`/mobile/tickets/${ticket.id}`}
      className={cn(
        "block rounded-lg border bg-background p-3 transition-colors hover:bg-muted/40",
        isUrgent && "border-destructive",
      )}
    >
      <div className="flex gap-3">
        {firstImage && (
          <Image
            src={firstImage}
            alt="工单图片"
            width={80}
            height={80}
            className="size-20 shrink-0 rounded object-cover"
          />
        )}
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-foreground">
              #{ticket.id}
            </span>
            <Badge variant={statusVariantMap[ticket.status]}>
              {ticket.status}
            </Badge>
            <Badge variant={isUrgent ? "destructive" : "outline"}>
              {ticket.severity}
            </Badge>
          </div>
          <p className="truncate text-sm text-foreground">
            {ticket.description}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {ticket.location}
          </p>
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-muted-foreground">
              {formatCreatedAt(ticket.created_at)}
            </span>
            <UserAvatarChip
              name={ticket.assignee.name}
              department={ticket.assignee.department}
              compact
            />
          </div>
        </div>
      </div>
    </Link>
  );
}
