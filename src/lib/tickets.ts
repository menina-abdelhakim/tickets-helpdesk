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
}

function buildWhere(actor: Actor, filters: TicketFilters): Prisma.TicketWhereInput {
  const search = filters.q?.trim()

  return {
    // Visibility first and always: the search must never widen what is readable.
    ...visibleTicketsWhere(actor),
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.mine ? { assignedToId: actor.id } : {}),
    ...(filters.unassigned ? { assignedToId: null } : {}),
    ...(search
      ? {
          OR: [
            { title: { contains: search, mode: 'insensitive' as const } },
            { description: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}),
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

export async function listTickets(
  actor: Actor,
  filters: TicketFilters = {},
): Promise<TicketListItem[]> {
  return prisma.ticket.findMany({
    where: buildWhere(actor, filters),
    select: listSelect,
    orderBy: [{ updatedAt: 'desc' }],
  })
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

/** Agents an admin can hand a ticket to. */
export async function listAssignableUsers() {
  return prisma.user.findMany({
    where: { role: { in: ['AGENT', 'ADMIN'] } },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  })
}
