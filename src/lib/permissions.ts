import type { Role, Status } from '@/generated/prisma/enums'

/** The subset of the session the authorisation rules actually need. */
export type Actor = { id: string; role: Role }

/** AGENT and ADMIN both handle tickets; only their assignment rights differ. */
export function isStaff(actor: Actor): boolean {
  return actor.role === 'AGENT' || actor.role === 'ADMIN'
}

/**
 * Visibility is enforced as a Prisma `where` fragment rather than by filtering
 * in JavaScript, so an unauthorised row is never loaded in the first place.
 * Every ticket query in the data layer spreads this.
 */
export function visibleTicketsWhere(actor: Actor) {
  return isStaff(actor) ? {} : { createdById: actor.id }
}

export function canViewTicket(actor: Actor, ticket: { createdById: string }): boolean {
  return isStaff(actor) || ticket.createdById === actor.id
}

/** Anyone who can see a ticket can discuss it. */
export function canComment(actor: Actor, ticket: { createdById: string }): boolean {
  return canViewTicket(actor, ticket)
}

/** Reporters must not be able to close their own ticket to force a resolution. */
export function canChangeStatus(actor: Actor): boolean {
  return isStaff(actor)
}

export function canSelfAssign(actor: Actor): boolean {
  return isStaff(actor)
}

/** Only an admin may hand a ticket to someone other than themselves. */
export function canAssignOthers(actor: Actor): boolean {
  return actor.role === 'ADMIN'
}

/**
 * Allowed status transitions. Encoded as data so the UI can render exactly the
 * buttons that will be accepted, and the server action can reject anything else.
 */
export const STATUS_TRANSITIONS: Record<Status, Status[]> = {
  OPEN: ['IN_PROGRESS', 'RESOLVED', 'CLOSED'],
  IN_PROGRESS: ['RESOLVED', 'CLOSED', 'OPEN'],
  RESOLVED: ['CLOSED', 'IN_PROGRESS'],
  CLOSED: ['OPEN'],
}

export function canTransition(from: Status, to: Status): boolean {
  return STATUS_TRANSITIONS[from].includes(to)
}
