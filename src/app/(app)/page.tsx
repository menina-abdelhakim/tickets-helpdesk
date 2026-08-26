import Link from 'next/link'
import { Suspense } from 'react'
import type { Status } from '@/generated/prisma/enums'
import { STATUS_LABELS_PLURAL } from '@/components/badges'
import { PlusIcon } from '@/components/icons'
import { Skeleton, TicketRowsSkeleton } from '@/components/skeleton'
import { TicketRow } from '@/components/ticket-row'
import { Button, Card, EmptyState, PageHeader } from '@/components/ui'
import { isStaff } from '@/lib/permissions'
import { requireUser, type CurrentUser } from '@/lib/session'
import { countByStatus, listTickets } from '@/lib/tickets'

const ORDER: Status[] = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']

/** Accent bar colour per tile, matching the status badges. */
const TILE_ACCENT: Record<Status, string> = {
  OPEN: 'bg-[oklch(0.55_0.19_255)]',
  IN_PROGRESS: 'bg-[oklch(0.65_0.16_75)]',
  RESOLVED: 'bg-[oklch(0.6_0.15_155)]',
  CLOSED: 'bg-content-subtle',
}

/**
 * Suspense lives inside the page rather than in a route-level `loading.tsx`.
 * A `loading.tsx` would place a boundary above every child route, including
 * `/tickets/[id]` — and once Next starts streaming, the 200 headers are already
 * sent, so `notFound()` could no longer answer with a real 404 there.
 */
async function DashboardStats({ user }: { user: CurrentUser }) {
  const counts = await countByStatus(user)

  return (
    <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {ORDER.map((status) => (
        <Link
          key={status}
          href={`/tickets?status=${status}`}
          data-testid={`count-${status}`}
          className="group relative overflow-hidden rounded-xl border border-border bg-surface p-4 shadow-[var(--shadow-card)] transition-all hover:border-border-strong hover:shadow-[var(--shadow-raised)]"
        >
          <span className={`absolute inset-x-0 top-0 h-0.5 ${TILE_ACCENT[status]}`} />
          <p className="text-xs font-medium uppercase tracking-wider text-content-subtle">
            {STATUS_LABELS_PLURAL[status]}
          </p>
          <p className="mt-2 text-3xl font-semibold tabular-nums tracking-tight text-content">
            {counts[status]}
          </p>
        </Link>
      ))}
    </section>
  )
}

async function RecentTickets({ user }: { user: CurrentUser }) {
  const recent = (await listTickets(user)).slice(0, 6)

  if (recent.length === 0) {
    return (
      <EmptyState
        title="Aucun ticket pour le moment"
        description="Les demandes ouvertes apparaîtront ici, la plus récente en premier."
        action={
          <Link href="/tickets/new">
            <Button variant="primary" size="sm">
              <PlusIcon />
              Créer le premier ticket
            </Button>
          </Link>
        }
      />
    )
  }

  return (
    <Card className="overflow-hidden">
      <ul className="divide-y divide-border">
        {recent.map((ticket) => (
          <TicketRow key={ticket.id} ticket={ticket} />
        ))}
      </ul>
    </Card>
  )
}

export default async function DashboardPage() {
  const user = await requireUser()

  return (
    <div className="space-y-8">
      <PageHeader
        title="Tableau de bord"
        description={
          isStaff(user)
            ? `Bonjour ${user.name.split(' ')[0]} — vue d’ensemble des demandes de support.`
            : `Bonjour ${user.name.split(' ')[0]} — le suivi de vos demandes.`
        }
        action={
          <Link href="/tickets/new">
            <Button variant="primary">
              <PlusIcon />
              Nouveau ticket
            </Button>
          </Link>
        }
      />

      <Suspense
        fallback={
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-[5.5rem] rounded-xl" />
            ))}
          </div>
        }
      >
        <DashboardStats user={user} />
      </Suspense>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-content">Activité récente</h2>
          <Link href="/tickets" className="text-sm font-medium text-accent hover:text-accent-hover">
            Tout voir
          </Link>
        </div>

        <Suspense
          fallback={
            <Card className="overflow-hidden">
              <TicketRowsSkeleton rows={4} />
            </Card>
          }
        >
          <RecentTickets user={user} />
        </Suspense>
      </section>
    </div>
  )
}
