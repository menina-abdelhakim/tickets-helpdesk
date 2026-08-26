import Link from 'next/link'
import type { Status } from '@/generated/prisma/enums'
import { STATUS_LABELS_PLURAL } from '@/components/badges'
import { PlusIcon, SearchIcon } from '@/components/icons'
import { TicketListHeader, TicketRow } from '@/components/ticket-row'
import { Button, Card, EmptyState, PageHeader } from '@/components/ui'
import { isStaff } from '@/lib/permissions'
import { requireUser } from '@/lib/session'
import { listTickets, type TicketFilters } from '@/lib/tickets'

const STATUSES: Status[] = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']

function isStatus(value: string | undefined): value is Status {
  return !!value && (STATUSES as string[]).includes(value)
}

/** Declared at module scope: a component created during render would remount
 *  on every pass and reset any state it held. */
function Filter({ label, href, active }: { label: string; href: string; active: boolean }) {
  return (
    <Link
      href={href}
      aria-current={active ? 'true' : undefined}
      className={`rounded-lg px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors ${
        active
          ? 'bg-content text-content-inverse'
          : 'border border-border bg-surface text-content-muted hover:border-border-strong hover:text-content'
      }`}
    >
      {label}
    </Link>
  )
}

export const metadata = { title: 'Tickets' }

export default async function TicketsPage({ searchParams }: PageProps<'/tickets'>) {
  const user = await requireUser()
  const params = await searchParams

  const statusParam = typeof params.status === 'string' ? params.status : undefined
  const query = typeof params.q === 'string' ? params.q : ''
  const filters: TicketFilters = {
    status: isStatus(statusParam) ? statusParam : undefined,
    mine: params.mine === '1',
    unassigned: params.unassigned === '1',
    q: query,
  }

  const tickets = await listTickets(user, filters)
  const noFilter = !filters.status && !filters.mine && !filters.unassigned

  /** Keeps the active filter when the search form is submitted. */
  const withQuery = (href: string) =>
    query ? `${href}${href.includes('?') ? '&' : '?'}q=${encodeURIComponent(query)}` : href

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tickets"
        description={
          isStaff(user) ? 'Toutes les demandes de support.' : 'Les demandes que vous avez ouvertes.'
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

      {/* A plain GET form: the search lives in the URL, so a filtered view can
          be bookmarked, shared and restored by the back button. */}
      <form method="get" action="/tickets" className="flex gap-2">
        {filters.status && <input type="hidden" name="status" value={filters.status} />}
        {filters.mine && <input type="hidden" name="mine" value="1" />}
        {filters.unassigned && <input type="hidden" name="unassigned" value="1" />}

        <div className="relative flex-1">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-content-subtle" />
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Rechercher un ticket…"
            aria-label="Rechercher un ticket"
            className="w-full rounded-lg border border-border bg-surface py-2 pl-9 pr-3 text-sm text-content placeholder:text-content-subtle transition-colors hover:border-border-strong focus:border-accent focus:outline-none"
          />
        </div>
        <Button type="submit">Rechercher</Button>
      </form>

      <div className="flex flex-wrap gap-2">
        <Filter label="Tous" href={withQuery('/tickets')} active={noFilter} />
        {STATUSES.map((status) => (
          <Filter
            key={status}
            label={STATUS_LABELS_PLURAL[status]}
            href={withQuery(`/tickets?status=${status}`)}
            active={filters.status === status}
          />
        ))}
        {isStaff(user) && (
          <>
            <span className="mx-1 hidden w-px bg-border sm:block" aria-hidden="true" />
            <Filter
              label="Qui me sont assignés"
              href={withQuery('/tickets?mine=1')}
              active={filters.mine === true}
            />
            <Filter
              label="Non assignés"
              href={withQuery('/tickets?unassigned=1')}
              active={filters.unassigned === true}
            />
          </>
        )}
      </div>

      {tickets.length === 0 ? (
        <EmptyState
          testId="empty-state"
          title={query ? `Aucun résultat pour « ${query} »` : 'Aucun ticket ne correspond à ce filtre'}
          description={
            query
              ? 'Essayez d’autres mots-clés, ou réinitialisez la recherche.'
              : 'Changez de statut, ou ouvrez une nouvelle demande.'
          }
          action={
            query ? (
              <Link href="/tickets">
                <Button size="sm">Réinitialiser la recherche</Button>
              </Link>
            ) : (
              <Link href="/tickets/new">
                <Button variant="primary" size="sm">
                  Créer un ticket
                </Button>
              </Link>
            )
          }
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-2.5 sm:px-5 lg:hidden">
            <p className="text-xs font-medium uppercase tracking-wider text-content-subtle">
              {tickets.length} ticket{tickets.length > 1 ? 's' : ''}
              {query && <span className="normal-case"> pour « {query} »</span>}
            </p>
            {query && (
              <Link href="/tickets" className="text-xs font-medium text-accent hover:underline">
                Effacer
              </Link>
            )}
          </div>
          <TicketListHeader />
          <ul data-testid="ticket-list" className="divide-y divide-border">
            {tickets.map((ticket) => (
              <TicketRow key={ticket.id} ticket={ticket} />
            ))}
          </ul>
        </Card>
      )}
    </div>
  )
}
