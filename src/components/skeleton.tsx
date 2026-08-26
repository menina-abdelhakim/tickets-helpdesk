export function Skeleton({ className = '' }: { className?: string }) {
  return <span className={`block animate-pulse rounded-md bg-surface-muted ${className}`} />
}

/** Placeholder rows matching the real ticket list, to avoid a layout jump. */
export function TicketRowsSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <ul className="divide-y divide-border" aria-hidden="true">
      {Array.from({ length: rows }).map((_, index) => (
        <li key={index} className="flex items-center gap-4 px-4 py-3.5 sm:px-5">
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
          </div>
          <Skeleton className="h-5 w-16 rounded-md" />
          <Skeleton className="size-7 rounded-full" />
        </li>
      ))}
    </ul>
  )
}
