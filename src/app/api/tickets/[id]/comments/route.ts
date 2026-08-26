import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getTicket, listComments, listEvents } from '@/lib/tickets'

/**
 * Feeds the 10-second poll on the ticket detail page. Returns the discussion
 * and the audit trail together: they are rendered as one timeline, so fetching
 * them separately would let the two halves drift out of step.
 *
 * Authorisation goes through the same scoped `getTicket` the page uses, so this
 * endpoint cannot be used to read a thread the caller may not see.
 */
export async function GET(_request: Request, ctx: RouteContext<'/api/tickets/[id]/comments'>) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const { id } = await ctx.params
  const actor = { id: session.user.id, role: session.user.role }

  const ticket = await getTicket(actor, id)
  if (!ticket) {
    return NextResponse.json({ error: 'Introuvable' }, { status: 404 })
  }

  const [comments, events] = await Promise.all([listComments(ticket.id), listEvents(ticket.id)])

  return NextResponse.json(
    {
      comments: comments.map((comment) => ({
        ...comment,
        createdAt: comment.createdAt.toISOString(),
      })),
      events: events.map((event) => ({
        ...event,
        createdAt: event.createdAt.toISOString(),
      })),
    },
    // The poll must never be served from a cache, or it would return the same
    // thread forever.
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
