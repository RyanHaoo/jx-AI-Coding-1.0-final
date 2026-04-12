export function DashboardTopBar() {
  return (
    <header className="flex h-12 items-center justify-between border-b bg-white px-6">
      <h1 className="text-base font-medium">建筑施工质检情报员</h1>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="inline-flex size-7 items-center justify-center rounded-full bg-muted text-xs font-medium">
          U
        </span>
        <span>用户</span>
      </div>
    </header>
  );
}
