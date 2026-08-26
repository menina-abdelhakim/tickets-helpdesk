import 'server-only'
import type { Prisma } from '@/generated/prisma/client'
import type { Status } from '@/generated/prisma/enums'
import { prisma } from '@/lib/prisma'
import { type Actor, visibleTicketsWhere } from '@/lib/permissions'

export type TicketFilters = {
  status?: Status
  /** Only tickets assigned to the current user. */
  mine?: boolean
  /** Only tickets nobody has picked up yet. */
  unassigned?: boolean
  /** Free-text search across the title and description. */
  q?: string
  sort?: SortField
  dir?: SortDirection
}

export const SORT_FIELDS = {
  activity: 'updatedAt',
  created: 'createdAt',
  priority: 'priority',
  status: 'status',
} as const

export type SortField = keyof typeof SORT_FIELDS
export type SortDirection = 'asc' | 'desc'

export function isSortField(value: string | undefined): value is SortField {
  return !!value && value in SORT_FIELDS
}

/**
 * Postgres orders an enum by its declaration order, and Priority is declared
 * LOW → URGENT. "Most urgent first" is therefore descending, which is the
 * opposite of what a user expects from an arrow pointing down, so priority
 * defaults to descending while everything else defaults to ascending.
 */
function orderBy(
  sort: SortField,
  dir: SortDirection,
): Prisma.TicketOrderByWithRelationInput[] {
  return [{ [SORT_FIELDS[sort]]: dir }, { reference: 'desc' }]
}

/**
 * Full-text search over the generated `searchVector` column.
 *
 * Only the ids are read here; the caller feeds them back into the normal Prisma
 * query so that visibility rules are applied in exactly one place and can never
 * be forgotten in a hand-written SQL string.
 */
async function searchTicketIds(term: string): Promise<string[]> {
  const rows = await prisma.$queryRaw<{ id: string }[]>`
    SELECT id
    FROM "Ticket"
    WHERE "searchVector" @@ websearch_to_tsquery('french', immutable_unaccent(${term}))
    ORDER BY ts_rank("searchVector", websearch_to_tsquery('french', immutable_unaccent(${term}))) DESC
    LIMIT 200
  `
  return rows.map((row) => row.id)
}

function buildWhere(
  actor: Actor,
  filters: TicketFilters,
  matchedIds: string[] | null,
): Prisma.TicketWhereInput {
  return {
    // Visibility first and always: the search must never widen what is readable.
    ...visibleTicketsWhere(actor),
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.mine ? { assignedToId: actor.id } : {}),
    ...(filters.unassigned ? { assignedToId: null } : {}),
    ...(matchedIds ? { id: { in: matchedIds } } : {}),
  }
}

/** Shape shared by the list rows and the dashboard, kept in one place. */
const listSelect = {
  id: true,
  reference: true,
  title: true,
  status: true,
  priority: true,
  createdAt: true,
  updatedAt: true,
  createdBy: { select: { id: true, name: true } },
  assignedTo: { select: { id: true, name: true } },
  _count: { select: { comments: true } },
} satisfies Prisma.TicketSelect

export type TicketListItem = Prisma.TicketGetPayload<{ select: typeof listSelect }>

export type TicketListRow = TicketListItem & { lastStaffReplyAt: Date | null }

export async function listTickets(
  actor: Actor,
  filters: TicketFilters = {},
): Promise<TicketListRow[]> {
  const term = filters.q?.trim()
  const matchedIds = term ? await searchTicketIds(term) : null

  // An empty match set must return nothing, not everything.
  if (matchedIds?.length === 0) return []

  const sort = filters.sort ?? 'activity'
  const dir = filters.dir ?? (sort === 'priority' ? 'desc' : 'desc')

  const tickets = await prisma.ticket.findMany({
    where: buildWhere(actor, filters, matchedIds),
    select: listSelect,
    orderBy: orderBy(sort, dir),
  })

  // With a search and no explicit sort, keep the relevance order the index gave
  // us rather than overriding it with a date.
  const ordered =
    matchedIds && !filters.sort
      ? [...tickets].sort((a, b) => matchedIds.indexOf(a.id) - matchedIds.indexOf(b.id))
      : tickets

  return withLastStaffReply(ordered)
}

/**
 * The SLA clock restarts on the last reply from support, so the list needs that
 * timestamp per ticket. One grouped query for the whole page rather than one
 * query per row.
 */
async function withLastStaffReply<T extends { id: string }>(
  tickets: T[],
): Promise<(T & { lastStaffReplyAt: Date | null })[]> {
  if (tickets.length === 0) return []

  const grouped = await prisma.comment.groupBy({
    by: ['ticketId'],
    where: {
      ticketId: { in: tickets.map((t) => t.id) },
      author: { role: { in: ['AGENT', 'ADMIN'] } },
    },
    _max: { createdAt: true },
  })

  const byTicket = new Map(grouped.map((row) => [row.ticketId, row._max.createdAt]))
  return tickets.map((ticket) => ({
    ...ticket,
    lastStaffReplyAt: byTicket.get(ticket.id) ?? null,
  }))
}

export async function lastStaffReplyAt(ticketId: string): Promise<Date | null> {
  const latest = await prisma.comment.findFirst({
    where: { ticketId, author: { role: { in: ['AGENT', 'ADMIN'] } } },
    orderBy: { createdAt: 'desc' },
    select: { createdAt: true },
  })
  return latest?.createdAt ?? null
}

/** Counts per status, already scoped to what this actor may see. */
export async function countByStatus(actor: Actor): Promise<Record<Status, number>> {
  const grouped = await prisma.ticket.groupBy({
    by: ['status'],
    where: visibleTicketsWhere(actor),
    _count: true,
  })

  const counts: Record<Status, number> = { OPEN: 0, IN_PROGRESS: 0, RESOLVED: 0, CLOSED: 0 }
  for (const row of grouped) counts[row.status] = row._count
  return counts
}

const detailSelect = {
  id: true,
  reference: true,
  title: true,
  description: true,
  status: true,
  priority: true,
  createdAt: true,
  updatedAt: true,
  createdById: true,
  createdBy: { select: { id: true, name: true, email: true } },
  assignedTo: { select: { id: true, name: true } },
} satisfies Prisma.TicketSelect

export type TicketDetail = Prisma.TicketGetPayload<{ select: typeof detailSelect }>

/**
 * Returns null both when the ticket does not exist and when the actor may not
 * see it — the caller renders a 404 either way, so nobody can probe for the
 * existence of other people's tickets.
 */
export async function getTicket(actor: Actor, id: string): Promise<TicketDetail | null> {
  return prisma.ticket.findFirst({
    where: { id, ...visibleTicketsWhere(actor) },
    select: detailSelect,
  })
}

export type TicketComment = {
  id: string
  body: string
  createdAt: Date
  author: { id: string; name: string }
}

export async function listComments(ticketId: string): Promise<TicketComment[]> {
  return prisma.comment.findMany({
    where: { ticketId },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      body: true,
      createdAt: true,
      author: { select: { id: true, name: true } },
    },
  })
}

export type TicketEventEntry = {
  id: string
  type: 'CREATED' | 'STATUS_CHANGED' | 'ASSIGNED' | 'UNASSIGNED'
  createdAt: Date
  fromStatus: Status | null
  toStatus: Status | null
  actor: { id: string; name: string }
  targetUser: { id: string; name: string } | null
}

export async function listEvents(ticketId: string): Promise<TicketEventEntry[]> {
  return prisma.ticketEvent.findMany({
    where: { ticketId },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      type: true,
      createdAt: true,
      fromStatus: true,
      toStatus: true,
      actor: { select: { id: true, name: true } },
      targetUser: { select: { id: true, name: true } },
    },
  })
}

/** Agents an admin can hand a ticket to. */
export async function listAssignableUsers() {
  return prisma.user.findMany({
    where: { role: { in: ['AGENT', 'ADMIN'] } },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  })
}
