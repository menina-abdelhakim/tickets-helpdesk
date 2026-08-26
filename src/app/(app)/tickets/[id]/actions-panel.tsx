import { STATUS_LABELS } from '@/components/badges'
import { CheckIcon, UserIcon } from '@/components/icons'
import { Button, Card, CardHeader } from '@/components/ui'
import type { Status } from '@/generated/prisma/enums'
import { STATUS_TRANSITIONS, canChangeStatus, canSelfAssign } from '@/lib/permissions'
import type { CurrentUser } from '@/lib/session'
import type { TicketDetail } from '@/lib/tickets'
import { assignToMe, changeStatus, unassign } from '../actions'

/**
 * Server component: renders only the transitions the actions will actually
 * accept, so the UI and the authorisation rules cannot drift apart.
 */
export function ActionsPanel({ ticket, user }: { ticket: TicketDetail; user: CurrentUser }) {
  const mayAssign = canSelfAssign(user)
  const mayChangeStatus = canChangeStatus(user)

  if (!mayAssign && !mayChangeStatus) return null

  const heldByMe = ticket.assignedTo?.id === user.id
  const nextStatuses: Status[] = STATUS_TRANSITIONS[ticket.status]

  return (
    <Card>
      <CardHeader>Actions</CardHeader>
      <div className="space-y-5 p-4">
        {mayAssign && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-content-muted">Assignation</p>
            {heldByMe ? (
              <form action={unassign}>
                <input type="hidden" name="ticketId" value={ticket.id} />
                <Button type="submit" data-testid="unassign" size="sm" className="w-full">
                  Me retirer du ticket
                </Button>
              </form>
            ) : (
              <form action={assignToMe}>
                <input type="hidden" name="ticketId" value={ticket.id} />
                <Button
                  type="submit"
                  data-testid="assign-to-me"
                  variant="primary"
                  size="sm"
                  className="w-full"
                >
                  <UserIcon />
                  {ticket.assignedTo ? 'Me l’attribuer' : 'Prendre en charge'}
                </Button>
              </form>
            )}
          </div>
        )}

        {mayChangeStatus && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-content-muted">Changer le statut</p>
            <div className="flex flex-wrap gap-2">
              {nextStatuses.map((status) => (
                <form key={status} action={changeStatus}>
                  <input type="hidden" name="ticketId" value={ticket.id} />
                  <input type="hidden" name="status" value={status} />
                  <Button type="submit" data-testid={`status-${status}`} size="sm">
                    {status === 'RESOLVED' && <CheckIcon />}
                    {STATUS_LABELS[status]}
                  </Button>
                </form>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
