import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PriorityBadge, PRIORITY_LABELS, StatusBadge } from '@/components/badges'
import { ArrowLeftIcon } from '@/components/icons'
import { Avatar, Card, CardHeader } from '@/components/ui'
import { absoluteTime, relativeTime } from '@/lib/format'
import { requireUser } from '@/lib/session'
import { getTicket, listComments } from '@/lib/tickets'
import { ActionsPanel } from './actions-panel'
import { CommentThread } from './comment-thread'

export async function generateMetadata({ params }: PageProps<'/tickets/[id]'>) {
  const user = await requireUser()
  const { id } = await params
  const ticket = await getTicket(user, id)
  return { title: ticket ? `#${ticket.reference} · ${ticket.title}` : 'Ticket introuvable' }
}

export default async function TicketPage({ params }: PageProps<'/tickets/[id]'>) {
  const user = await requireUser()
  const { id } = await params

  // getTicket already scopes by visibility, so "not yours" and "does not exist"
  // are indistinguishable from the outside.
  const ticket = await getTicket(user, id)
  if (!ticket) notFound()

  const comments = await listComments(ticket.id)

  return (
    <div className="space-y-6">
      <Link
        href="/tickets"
        className="inline-flex items-center gap-1.5 text-sm text-content-muted transition-colors hover:text-content"
      >
        <ArrowLeftIcon className="size-4" />
        Retour aux tickets
      </Link>

      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-sm text-content-subtle">#{ticket.reference}</span>
          <StatusBadge status={ticket.status} />
          <PriorityBadge priority={ticket.priority} />
        </div>
        <h1 className="max-w-4xl text-xl font-semibold tracking-tight text-content sm:text-2xl">
          {ticket.title}
        </h1>
        <p className="text-sm text-content-muted">
          Ouvert par <span className="text-content">{ticket.createdBy.name}</span>{' '}
          <time dateTime={ticket.createdAt.toISOString()}>{relativeTime(ticket.createdAt)}</time>
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_21rem] xl:gap-8">
        <div className="space-y-6">
          <Card className="p-5 sm:p-6">
            {/* Capped: a line of prose stops being readable past ~75 characters,
                however wide the viewport gets. */}
            <p className="max-w-[68ch] whitespace-pre-wrap text-sm leading-relaxed text-content">
              {ticket.description}
            </p>
          </Card>

          <CommentThread
            ticketId={ticket.id}
            currentUserId={user.id}
            initialComments={comments.map((comment) => ({
              ...comment,
              createdAt: comment.createdAt.toISOString(),
            }))}
          />
        </div>

        <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <ActionsPanel ticket={ticket} user={user} />

          <Card>
            <CardHeader>Détails</CardHeader>
            <dl className="divide-y divide-border text-sm">
              <div className="flex items-center justify-between gap-3 px-4 py-3">
                <dt className="text-content-muted">Assigné à</dt>
                <dd data-testid="assignee">
                  {ticket.assignedTo ? (
                    <span className="flex items-center gap-2">
                      <Avatar name={ticket.assignedTo.name} size="sm" />
                      <span className="text-content">{ticket.assignedTo.name}</span>
                    </span>
                  ) : (
                    <span data-testid="unassigned" className="text-content-subtle">
                      Non assigné
                    </span>
                  )}
                </dd>
              </div>

              <div className="flex items-center justify-between gap-3 px-4 py-3">
                <dt className="text-content-muted">Demandeur</dt>
                <dd className="flex items-center gap-2">
                  <Avatar name={ticket.createdBy.name} size="sm" />
                  <span className="text-content">{ticket.createdBy.name}</span>
                </dd>
              </div>

              <div className="flex items-center justify-between gap-3 px-4 py-3">
                <dt className="text-content-muted">Priorité</dt>
                <dd className="text-content">{PRIORITY_LABELS[ticket.priority]}</dd>
              </div>

              <div className="flex items-center justify-between gap-3 px-4 py-3">
                <dt className="text-content-muted">Créé le</dt>
                <dd className="text-right text-content">{absoluteTime(ticket.createdAt)}</dd>
              </div>

              <div className="flex items-center justify-between gap-3 px-4 py-3">
                <dt className="text-content-muted">Activité</dt>
                <dd className="text-content">{relativeTime(ticket.updatedAt)}</dd>
              </div>
            </dl>
          </Card>
        </div>
      </div>
    </div>
  )
}
