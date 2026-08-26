import Link from 'next/link'
import { PriorityBadge, StatusBadge } from '@/components/badges'
import { Avatar } from '@/components/ui'
import { relativeTime } from '@/lib/format'
import type { TicketListItem } from '@/lib/tickets'

/** Shared by the dashboard and the ticket list so both stay identical. */
export function TicketRow({ ticket }: { ticket: TicketListItem }) {
  return (
    <li>
      <Link
        href={`/tickets/${ticket.id}`}
        className="flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-surface-hover sm:px-5"
      >
        <div className="min-w-0 flex-1 space-y-1">
          <p className="flex items-baseline gap-2 truncate text-sm font-medium text-content">
            <span className="font-mono text-xs text-content-subtle">#{ticket.reference}</span>
            {ticket.title}
          </p>
          <p className="truncate text-xs text-content-subtle">
            {ticket.createdBy.name} · {relativeTime(ticket.updatedAt)}
            {ticket._count.comments > 0 && (
              <> · {ticket._count.comments} message{ticket._count.comments > 1 ? 's' : ''}</>
            )}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <PriorityBadge priority={ticket.priority} />
          <StatusBadge status={ticket.status} />
          {ticket.assignedTo ? (
            <span title={`Assigné à ${ticket.assignedTo.name}`}>
              <Avatar name={ticket.assignedTo.name} size="sm" />
            </span>
          ) : (
            <span
              title="Non assigné"
              aria-hidden="true"
              className="size-7 shrink-0 rounded-full border border-dashed border-border-strong"
            />
          )}
        </div>
      </Link>
    </li>
  )
}
