import Link from 'next/link'
import { PriorityBadge, SlaBadge, StatusBadge } from '@/components/badges'
import { Avatar } from '@/components/ui'
import { relativeTime } from '@/lib/format'
import { slaHoursRemaining, slaLevel } from '@/lib/sla'
import type { SortDirection, SortField, TicketListRow } from '@/lib/tickets'

/**
 * Column template shared by the row and the list header, so the labels line up
 * with the values. Below `lg` it collapses to a two-part flex layout.
 */
const COLUMNS = 'lg:grid lg:grid-cols-[minmax(0,1fr)_6rem_7.5rem_11rem] lg:items-center lg:gap-4'

export function TicketListHeader({
  sort,
  dir,
  hrefFor,
}: {
  sort: SortField
  dir: SortDirection
  /** Builds the URL that sorts by `field`, toggling direction when already active. */
  hrefFor: (field: SortField) => string
}) {
  const column = (field: SortField, label: string) => {
    const active = sort === field
    return (
      <Link
        href={hrefFor(field)}
        aria-sort={active ? (dir === 'asc' ? 'ascending' : 'descending') : 'none'}
        className={`inline-flex items-center gap-1 transition-colors hover:text-content ${
          active ? 'text-content' : ''
        }`}
      >
        {label}
        <span aria-hidden="true" className={active ? 'opacity-100' : 'opacity-0'}>
          {dir === 'asc' ? '↑' : '↓'}
        </span>
      </Link>
    )
  }

  return (
    <div
      className={`hidden border-b border-border px-4 py-2.5 text-xs font-medium uppercase tracking-wider text-content-subtle sm:px-5 ${COLUMNS}`}
    >
      {column('activity', 'Ticket')}
      {column('priority', 'Priorité')}
      {column('status', 'Statut')}
      <span>Assigné à</span>
    </div>
  )
}

/** Shared by the dashboard and the ticket list so both stay identical. */
export function TicketRow({ ticket }: { ticket: TicketListRow }) {
  const sla = {
    level: slaLevel({
      priority: ticket.priority,
      status: ticket.status,
      createdAt: ticket.createdAt,
      lastStaffReplyAt: ticket.lastStaffReplyAt,
    }),
    hoursRemaining: slaHoursRemaining({
      priority: ticket.priority,
      createdAt: ticket.createdAt,
      lastStaffReplyAt: ticket.lastStaffReplyAt,
    }),
  }

  return (
    <li>
      <Link
        href={`/tickets/${ticket.id}`}
        className={`flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-surface-hover sm:px-5 ${COLUMNS}`}
      >
        <div className="min-w-0 flex-1 space-y-1">
          <p className="flex items-baseline gap-2 truncate text-sm font-medium text-content">
            <span className="font-mono text-xs text-content-subtle">#{ticket.reference}</span>
            {ticket.title}
          </p>
          <p className="flex flex-wrap items-center gap-x-1.5 gap-y-1 truncate text-xs text-content-subtle">
            <span>
              {ticket.createdBy.name} · {relativeTime(ticket.updatedAt)}
              {ticket._count.comments > 0 && (
                <> · {ticket._count.comments} message{ticket._count.comments > 1 ? 's' : ''}</>
              )}
            </span>
            {/* Only surfaced when it needs attention — a green "on time" badge on
                every row would be noise. */}
            {sla.level !== 'ok' && (
              <SlaBadge level={sla.level} hoursRemaining={sla.hoursRemaining} />
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
