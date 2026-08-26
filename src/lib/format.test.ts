import { afterEach, describe, expect, it, vi } from 'vitest'
import { absoluteTime, relativeTime } from '@/lib/format'

const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

/** Freeze the clock so the assertions do not depend on when they run. */
function at(now: string) {
  vi.useFakeTimers()
  vi.setSystemTime(new Date(now))
}

afterEach(() => {
  vi.useRealTimers()
})

describe('relativeTime', () => {
  it('collapses anything under a minute to "à l\'instant"', () => {
    at('2026-08-26T12:00:00Z')
    expect(relativeTime(new Date(Date.now() - 30_000))).toBe("à l'instant")
    expect(relativeTime(new Date(Date.now()))).toBe("à l'instant")
  })

  it('counts minutes and hours', () => {
    at('2026-08-26T12:00:00Z')
    expect(relativeTime(new Date(Date.now() - 5 * MINUTE))).toBe('il y a 5 minutes')
    expect(relativeTime(new Date(Date.now() - 59 * MINUTE))).toBe('il y a 59 minutes')
    expect(relativeTime(new Date(Date.now() - 3 * HOUR))).toBe('il y a 3 heures')
  })

  it('uses the largest unit that fits', () => {
    at('2026-08-26T12:00:00Z')
    // 59 minutes is still minutes; 25 hours has rolled over into days.
    expect(relativeTime(new Date(Date.now() - 59 * MINUTE))).toMatch(/minute/)
    expect(relativeTime(new Date(Date.now() - 25 * HOUR))).toBe('hier')
  })

  it('prefers idiomatic French for the nearest days', () => {
    // `numeric: 'auto'` is deliberate: "hier" reads better than "il y a 1 jour".
    at('2026-08-26T12:00:00Z')
    expect(relativeTime(new Date(Date.now() - 1 * DAY))).toBe('hier')
    expect(relativeTime(new Date(Date.now() - 2 * DAY))).toBe('avant-hier')
    expect(relativeTime(new Date(Date.now() - 3 * DAY))).toBe('il y a 3 jours')
    expect(relativeTime(new Date(Date.now() - 10 * DAY))).toBe('il y a 10 jours')
  })

  it('handles a future date without crashing', () => {
    at('2026-08-26T12:00:00Z')
    expect(relativeTime(new Date(Date.now() + 2 * DAY))).toBe('après-demain')
    expect(relativeTime(new Date(Date.now() + 5 * DAY))).toMatch(/dans 5 jours/)
  })

  it('falls back to months and years for distant dates', () => {
    at('2026-08-26T12:00:00Z')
    expect(relativeTime(new Date(Date.now() - 60 * DAY))).toMatch(/mois/)
    expect(relativeTime(new Date(Date.now() - 400 * DAY))).toMatch(/an/)
  })
})

describe('absoluteTime', () => {
  it('formats a full French date and time', () => {
    const formatted = absoluteTime(new Date('2026-08-23T13:16:00Z'))
    expect(formatted).toMatch(/2026/)
    expect(formatted).toMatch(/août/)
    expect(formatted).toMatch(/\d{1,2}:\d{2}/)
  })
})
