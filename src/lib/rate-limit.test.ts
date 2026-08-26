import { describe, expect, it } from 'vitest'
import {
  TICKET_RATE_LIMIT,
  exceedsTicketRateLimit,
  rateLimitMessage,
  rateLimitWindowStart,
} from '@/lib/rate-limit'

describe('exceedsTicketRateLimit', () => {
  it('allows up to the limit and blocks at it', () => {
    expect(exceedsTicketRateLimit(0)).toBe(false)
    expect(exceedsTicketRateLimit(TICKET_RATE_LIMIT.max - 1)).toBe(false)
    expect(exceedsTicketRateLimit(TICKET_RATE_LIMIT.max)).toBe(true)
    // Defensive: a count above the limit must not wrap around to allowed.
    expect(exceedsTicketRateLimit(TICKET_RATE_LIMIT.max + 50)).toBe(true)
  })
})

describe('rateLimitWindowStart', () => {
  it('looks back exactly the configured window', () => {
    const now = new Date('2026-08-26T12:00:00Z')
    expect(rateLimitWindowStart(now).toISOString()).toBe('2026-08-26T11:50:00.000Z')
  })
})

describe('rateLimitMessage', () => {
  it('tells the user how long to wait', () => {
    expect(rateLimitMessage()).toContain(String(TICKET_RATE_LIMIT.windowMinutes))
  })
})
