import type { Priority, Status } from '@/generated/prisma/enums'

export const STATUS_LABELS: Record<Status, string> = {
  OPEN: 'Ouvert',
  IN_PROGRESS: 'En cours',
  RESOLVED: 'Résolu',
  CLOSED: 'Clôturé',
}

/** Plural form used for the dashboard tiles and filter tabs. */
export const STATUS_LABELS_PLURAL: Record<Status, string> = {
  OPEN: 'Ouverts',
  IN_PROGRESS: 'En cours',
  RESOLVED: 'Résolus',
  CLOSED: 'Clôturés',
}

/**
 * Status colours are raw oklch rather than tokens: they carry meaning of their
 * own and are tuned against the light surfaces they sit on.
 */
const STATUS_STYLES: Record<Status, string> = {
  OPEN: 'text-[oklch(0.45_0.16_255)] bg-[oklch(0.96_0.03_255)]',
  IN_PROGRESS: 'text-[oklch(0.48_0.13_75)] bg-[oklch(0.96_0.05_85)]',
  RESOLVED: 'text-[oklch(0.48_0.13_155)] bg-[oklch(0.95_0.05_155)]',
  CLOSED: 'text-content-muted bg-surface-muted',
}

const STATUS_DOTS: Record<Status, string> = {
  OPEN: 'bg-[oklch(0.55_0.19_255)]',
  IN_PROGRESS: 'bg-[oklch(0.65_0.16_75)]',
  RESOLVED: 'bg-[oklch(0.6_0.15_155)]',
  CLOSED: 'bg-content-subtle',
}

export const PRIORITY_LABELS: Record<Priority, string> = {
  LOW: 'Basse',
  MEDIUM: 'Normale',
  HIGH: 'Haute',
  URGENT: 'Urgente',
}

const PRIORITY_STYLES: Record<Priority, string> = {
  LOW: 'text-content-muted bg-surface-muted',
  MEDIUM: 'text-content-muted bg-surface-muted',
  HIGH: 'text-[oklch(0.52_0.16_45)] bg-[oklch(0.96_0.04_55)]',
  URGENT: 'text-[oklch(0.52_0.2_20)] bg-[oklch(0.96_0.04_20)]',
}

const BASE =
  'inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium whitespace-nowrap'

export function StatusBadge({ status }: { status: Status }) {
  // The test id matters: the actions panel renders buttons with these same
  // labels, so a text-based selector would match the button and assert nothing.
  return (
    <span data-testid="status-badge" className={`${BASE} ${STATUS_STYLES[status]}`}>
      <span className={`size-1.5 rounded-full ${STATUS_DOTS[status]}`} aria-hidden="true" />
      {STATUS_LABELS[status]}
    </span>
  )
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  // Normal priority is the default and carries no information — don't shout it.
  if (priority === 'MEDIUM') return null
  return <span className={`${BASE} ${PRIORITY_STYLES[priority]}`}>{PRIORITY_LABELS[priority]}</span>
}
