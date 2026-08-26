'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { Priority, Status } from '@/generated/prisma/enums'
import {
  canAssignOthers,
  canChangeStatus,
  canComment,
  canSelfAssign,
  canTransition,
} from '@/lib/permissions'
import { prisma } from '@/lib/prisma'
import {
  exceedsTicketRateLimit,
  rateLimitMessage,
  rateLimitWindowStart,
} from '@/lib/rate-limit'
import { requireUser } from '@/lib/session'
import { getTicket } from '@/lib/tickets'

export type FormState = { error?: string }

/** `ok` carries a timestamp so the client can tell two successes apart and
 *  re-fetch the thread immediately instead of waiting for the next poll. */
export type CommentFormState = { error?: string; ok?: number }

const createSchema = z.object({
  title: z.string().trim().min(5, 'Le titre doit faire au moins 5 caractères.').max(140),
  description: z
    .string()
    .trim()
    .min(20, 'Décrivez le problème en au moins 20 caractères.')
    .max(5000),
  priority: z.enum(Priority),
})

export async function createTicket(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser()

  const parsed = createSchema.safeParse({
    title: formData.get('title'),
    description: formData.get('description'),
    priority: formData.get('priority'),
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  // The demo is public: without this a single visitor can fill the board.
  // The window is counted in the database, not in memory, so it survives cold
  // starts and cannot be reset by opening a new connection.
  const recent = await prisma.ticket.count({
    where: { createdById: user.id, createdAt: { gte: rateLimitWindowStart() } },
  })
  if (exceedsTicketRateLimit(recent)) {
    return { error: rateLimitMessage() }
  }

  const ticket = await prisma.$transaction(async (tx) => {
    const created = await tx.ticket.create({
      data: { ...parsed.data, createdById: user.id },
      select: { id: true },
    })
    await tx.ticketEvent.create({
      data: { ticketId: created.id, actorId: user.id, type: 'CREATED' },
    })
    return created
  })

  revalidatePath('/tickets')
  revalidatePath('/')
  redirect(`/tickets/${ticket.id}`)
}

const commentSchema = z.object({
  ticketId: z.string().min(1),
  body: z.string().trim().min(1, 'Le message ne peut pas être vide.').max(5000),
})

export async function addComment(
  _prev: CommentFormState,
  formData: FormData,
): Promise<CommentFormState> {
  const user = await requireUser()

  const parsed = commentSchema.safeParse({
    ticketId: formData.get('ticketId'),
    body: formData.get('body'),
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  // Re-read through the scoped query: the form field is user input and must not
  // be trusted to point at a ticket this user is allowed to touch.
  const ticket = await getTicket(user, parsed.data.ticketId)
  if (!ticket || !canComment(user, ticket)) {
    return { error: "Ticket introuvable ou accès refusé." }
  }

  await prisma.comment.create({
    data: { ticketId: ticket.id, authorId: user.id, body: parsed.data.body },
  })

  // Bump updatedAt so the ticket rises in the "recent activity" list.
  await prisma.ticket.update({ where: { id: ticket.id }, data: { updatedAt: new Date() } })

  revalidatePath(`/tickets/${ticket.id}`)
  return { ok: Date.now() }
}

export async function assignToMe(formData: FormData): Promise<void> {
  const user = await requireUser()
  const ticketId = String(formData.get('ticketId') ?? '')

  const ticket = await getTicket(user, ticketId)
  if (!ticket || !canSelfAssign(user)) return

  // Ticket change and audit entry share a transaction: a ticket must never
  // move without leaving a trace, and a trace must never describe a move that
  // did not happen.
  await prisma.$transaction([
    prisma.ticket.update({ where: { id: ticket.id }, data: { assignedToId: user.id } }),
    prisma.ticketEvent.create({
      data: {
        ticketId: ticket.id,
        actorId: user.id,
        type: 'ASSIGNED',
        targetUserId: user.id,
      },
    }),
  ])
  revalidatePath(`/tickets/${ticket.id}`)
  revalidatePath('/tickets')
}

export async function unassign(formData: FormData): Promise<void> {
  const user = await requireUser()
  const ticketId = String(formData.get('ticketId') ?? '')

  const ticket = await getTicket(user, ticketId)
  if (!ticket || !canSelfAssign(user)) return

  // An agent may drop a ticket they hold; only an admin may unassign someone else.
  if (ticket.assignedTo?.id !== user.id && !canAssignOthers(user)) return

  const previousAssignee = ticket.assignedTo?.id ?? null

  await prisma.$transaction([
    prisma.ticket.update({ where: { id: ticket.id }, data: { assignedToId: null } }),
    prisma.ticketEvent.create({
      data: {
        ticketId: ticket.id,
        actorId: user.id,
        type: 'UNASSIGNED',
        targetUserId: previousAssignee,
      },
    }),
  ])
  revalidatePath(`/tickets/${ticket.id}`)
  revalidatePath('/tickets')
}

const statusSchema = z.object({
  ticketId: z.string().min(1),
  status: z.enum(Status),
})

export async function changeStatus(formData: FormData): Promise<void> {
  const user = await requireUser()

  const parsed = statusSchema.safeParse({
    ticketId: formData.get('ticketId'),
    status: formData.get('status'),
  })
  if (!parsed.success) return

  const ticket = await getTicket(user, parsed.data.ticketId)
  if (!ticket || !canChangeStatus(user)) return

  // The UI only renders legal transitions, but the action re-checks: a crafted
  // POST must not be able to jump a ticket straight from CLOSED to RESOLVED.
  if (!canTransition(ticket.status, parsed.data.status)) return

  await prisma.$transaction([
    prisma.ticket.update({
      where: { id: ticket.id },
      data: { status: parsed.data.status },
    }),
    prisma.ticketEvent.create({
      data: {
        ticketId: ticket.id,
        actorId: user.id,
        type: 'STATUS_CHANGED',
        fromStatus: ticket.status,
        toStatus: parsed.data.status,
      },
    }),
  ])

  revalidatePath(`/tickets/${ticket.id}`)
  revalidatePath('/tickets')
  revalidatePath('/')
}
