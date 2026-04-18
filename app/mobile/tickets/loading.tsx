export default function TicketsLoading() {
  return (
    <div className="space-y-3">
      <div className="h-9 w-full animate-pulse rounded bg-muted" />
      <ul className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <li
            // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton items
            key={i}
            className="space-y-2 rounded-lg border p-3"
          >
            <div className="flex gap-2">
              <div className="h-5 w-12 animate-pulse rounded bg-muted" />
              <div className="h-5 w-14 animate-pulse rounded bg-muted" />
              <div className="h-5 w-12 animate-pulse rounded bg-muted" />
            </div>
            <div className="h-4 w-full animate-pulse rounded bg-muted" />
            <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
            <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
          </li>
        ))}
      </ul>
    </div>
  );
}
