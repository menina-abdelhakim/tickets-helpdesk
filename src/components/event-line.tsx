import { STATUS_LABELS } from '@/components/badges'
import type { Status } from '@/generated/prisma/enums'

export type WireEvent = {
  id: string
  type: 'CREATED' | 'STATUS_CHANGED' | 'ASSIGNED' | 'UNASSIGNED'
  createdAt: string
  fromStatus: Status | null
  toStatus: Status | null
  actor: { id: string; name: string }
  targetUser: { id: string; name: string } | null
}

/**
 * Turns an audit row into a French sentence. Self-assignment reads differently
 * from assigning someone else, which is the distinction the actor/target pair
 * exists to preserve.
 */
export function describeEvent(event: WireEvent): string {
  const actor = event.actor.name
  const target = event.targetUser?.name
  const self = event.targetUser?.id === event.actor.id

  switch (event.type) {
    case 'CREATED':
      return `${actor} a ouvert le ticket`
    case 'STATUS_CHANGED': {
      const from = event.fromStatus ? STATUS_LABELS[event.fromStatus] : '—'
      const to = event.toStatus ? STATUS_LABELS[event.toStatus] : '—'
      return `${actor} a changé le statut de « ${from} » à « ${to} »`
    }
    case 'ASSIGNED':
      return self ? `${actor} a pris le ticket en charge` : `${actor} a assigné le ticket à ${target}`
    case 'UNASSIGNED':
      if (self) return `${actor} s’est retiré du ticket`
      return target ? `${actor} a retiré ${target} du ticket` : `${actor} a désassigné le ticket`
  }
}
