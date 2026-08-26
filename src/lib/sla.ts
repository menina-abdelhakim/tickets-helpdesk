import type { Priority, Status } from '@/generated/prisma/enums'

/**
 * How long a ticket may wait for a reply from support before it is late.
 * Expressed in hours, per priority — an outage cannot wait as long as a
 * "nice to have".
 */
export const SLA_TARGET_HOURS: Record<Priority, number> = {
  URGENT: 2,
  HIGH: 8,
  MEDIUM: 24,
  LOW: 72,
}

/** Fraction of the target after which a ticket is flagged as approaching. */
const WARNING_RATIO = 0.75

export type SlaLevel = 'none' | 'ok' | 'due' | 'breached'

export type SlaInput = {
  priority: Priority
  status: Status
  createdAt: Date
  /** Last comment written by an agent or an admin, if any. */
  lastStaffReplyAt: Date | null
  now?: Date
}

/**
 * A ticket's clock runs from the last time support answered — or from creation
 * if nobody has. Resolved and closed tickets have no clock at all: chasing an
 * SLA on finished work only produces noise.
 */
export function slaLevel({
  priority,
  status,
  createdAt,
  lastStaffReplyAt,
  now = new Date(),
}: SlaInput): SlaLevel {
  if (status === 'RESOLVED' || status === 'CLOSED') return 'none'

  const since = lastStaffReplyAt ?? createdAt
  const elapsedHours = (now.getTime() - since.getTime()) / 3_600_000
  const target = SLA_TARGET_HOURS[priority]

  if (elapsedHours >= target) return 'breached'
  if (elapsedHours >= target * WARNING_RATIO) return 'due'
  return 'ok'
}

/** Hours left before the target, negative once it is missed. */
export function slaHoursRemaining({
  priority,
  createdAt,
  lastStaffReplyAt,
  now = new Date(),
}: Omit<SlaInput, 'status'>): number {
  const since = lastStaffReplyAt ?? createdAt
  const elapsedHours = (now.getTime() - since.getTime()) / 3_600_000
  return SLA_TARGET_HOURS[priority] - elapsedHours
}
