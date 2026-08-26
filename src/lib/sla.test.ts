import { describe, expect, it } from 'vitest'
import { SLA_TARGET_HOURS, slaHoursRemaining, slaLevel, type SlaInput } from '@/lib/sla'

const NOW = new Date('2026-08-26T12:00:00Z')
const hoursAgo = (h: number) => new Date(NOW.getTime() - h * 3_600_000)

const base: SlaInput = {
  priority: 'HIGH', // 8h target
  status: 'OPEN',
  createdAt: hoursAgo(1),
  lastStaffReplyAt: null,
  now: NOW,
}

describe('slaLevel', () => {
  it('has no clock once the ticket is resolved or closed', () => {
    expect(slaLevel({ ...base, status: 'RESOLVED', createdAt: hoursAgo(500) })).toBe('none')
    expect(slaLevel({ ...base, status: 'CLOSED', createdAt: hoursAgo(500) })).toBe('none')
  })

  it('is ok well inside the target', () => {
    expect(slaLevel({ ...base, createdAt: hoursAgo(1) })).toBe('ok')
  })

  it('warns once three quarters of the target has elapsed', () => {
    // HIGH targets 8h, so the warning starts at 6h.
    expect(slaLevel({ ...base, createdAt: hoursAgo(5.9) })).toBe('ok')
    expect(slaLevel({ ...base, createdAt: hoursAgo(6) })).toBe('due')
    expect(slaLevel({ ...base, createdAt: hoursAgo(7.9) })).toBe('due')
  })

  it('breaches exactly at the target', () => {
    expect(slaLevel({ ...base, createdAt: hoursAgo(8) })).toBe('breached')
    expect(slaLevel({ ...base, createdAt: hoursAgo(48) })).toBe('breached')
  })

  it('restarts the clock from the last staff reply, not from creation', () => {
    // Opened three days ago, but support answered ten minutes ago.
    expect(
      slaLevel({ ...base, createdAt: hoursAgo(72), lastStaffReplyAt: hoursAgo(0.16) }),
    ).toBe('ok')
  })

  it('scales the target with priority', () => {
    const at = (priority: SlaInput['priority'], h: number) =>
      slaLevel({ ...base, priority, createdAt: hoursAgo(h) })

    // Three hours in: urgent has blown its 2h target, low is still comfortable.
    expect(at('URGENT', 3)).toBe('breached')
    expect(at('HIGH', 3)).toBe('ok')
    expect(at('MEDIUM', 3)).toBe('ok')
    expect(at('LOW', 3)).toBe('ok')
  })

  it('orders the targets from most to least urgent', () => {
    expect(SLA_TARGET_HOURS.URGENT).toBeLessThan(SLA_TARGET_HOURS.HIGH)
    expect(SLA_TARGET_HOURS.HIGH).toBeLessThan(SLA_TARGET_HOURS.MEDIUM)
    expect(SLA_TARGET_HOURS.MEDIUM).toBeLessThan(SLA_TARGET_HOURS.LOW)
  })
})

describe('slaHoursRemaining', () => {
  it('counts down and goes negative past the target', () => {
    expect(slaHoursRemaining({ ...base, createdAt: hoursAgo(2) })).toBeCloseTo(6, 5)
    expect(slaHoursRemaining({ ...base, createdAt: hoursAgo(10) })).toBeCloseTo(-2, 5)
  })
})
