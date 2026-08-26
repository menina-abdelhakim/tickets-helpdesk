/**
 * Ticket creation is rate limited per user. The demo is public, so without this
 * a single visitor can fill the board in a loop.
 *
 * The counter is the database itself — how many tickets this user created in
 * the window — rather than an in-memory map, which would reset on every
 * serverless cold start and be trivially bypassed.
 */
export const TICKET_RATE_LIMIT = {
  max: 5,
  windowMinutes: 10,
} as const

export function rateLimitWindowStart(now: Date = new Date()): Date {
  return new Date(now.getTime() - TICKET_RATE_LIMIT.windowMinutes * 60_000)
}

export function exceedsTicketRateLimit(recentCount: number): boolean {
  return recentCount >= TICKET_RATE_LIMIT.max
}

export function rateLimitMessage(): string {
  return `Trop de tickets créés coup sur coup. Réessayez dans ${TICKET_RATE_LIMIT.windowMinutes} minutes.`
}
