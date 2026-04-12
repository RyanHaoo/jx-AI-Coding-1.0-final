import { use } from "react";

export default function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <div>
      <h2 className="text-lg font-medium">工单详情</h2>
      <p className="mt-2 text-sm text-muted-foreground">工单 ID: {id}</p>
    </div>
  );
}
