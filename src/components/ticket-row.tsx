import Link from 'next/link'
import { PriorityBadge, StatusBadge } from '@/components/badges'
import { Avatar } from '@/components/ui'
import { relativeTime } from '@/lib/format'
import type { TicketListItem } from '@/lib/tickets'

/**
 * Column template shared by the row and the list header, so the labels line up
 * with the values. Below `lg` it collapses to a two-part flex layout.
 */
export const TICKET_COLUMNS = 'lg:grid lg:grid-cols-[minmax(0,1fr)_6rem_7.5rem_11rem] lg:items-center lg:gap-4'

export function TicketListHeader() {
  return (
    <div
      className={`hidden border-b border-border px-4 py-2.5 text-xs font-medium uppercase tracking-wider text-content-subtle sm:px-5 ${TICKET_COLUMNS}`}
    >
      <span>Ticket</span>
      <span>Priorité</span>
      <span>Statut</span>
      <span>Assigné à</span>
    </div>
  )
}

/** Shared by the dashboard and the ticket list so both stay identical. */
export function TicketRow({ ticket }: { ticket: TicketListItem }) {
  return (
    <li>
      <Link
        href={`/tickets/${ticket.id}`}
        className={`flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-surface-hover sm:px-5 ${TICKET_COLUMNS}`}
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

        {/* Below `lg` these three collapse into one right-aligned cluster. */}
        <div className="flex shrink-0 items-center gap-2 lg:contents">
          <span className="lg:block">
            <PriorityBadge priority={ticket.priority} />
          </span>
          <span className="lg:block">
            <StatusBadge status={ticket.status} />
          </span>
          <span className="flex min-w-0 items-center gap-2">
            {ticket.assignedTo ? (
              <>
                <Avatar name={ticket.assignedTo.name} size="sm" />
                {/* The name only earns its place once there is room for it. */}
                <span className="hidden truncate text-sm text-content-muted lg:inline">
                  {ticket.assignedTo.name}
                </span>
              </>
            ) : (
              <>
                <span
                  aria-hidden="true"
                  className="size-7 shrink-0 rounded-full border border-dashed border-border-strong"
                />
                <span className="hidden text-sm text-content-subtle lg:inline">Non assigné</span>
              </>
            )}
          </span>
        </div>
      </Link>
    </li>
  )
}
