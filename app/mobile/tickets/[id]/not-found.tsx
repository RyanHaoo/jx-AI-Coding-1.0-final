import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function TicketNotFound() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
      <p className="text-base font-medium text-foreground">
        工单不存在或无权访问
      </p>
      <p className="text-sm text-muted-foreground">
        该工单可能已被删除，或不在当前项目范围内
      </p>
      <Button asChild variant="default">
        <Link href="/mobile/tickets">返回工单列表</Link>
      </Button>
    </div>
  );
}
