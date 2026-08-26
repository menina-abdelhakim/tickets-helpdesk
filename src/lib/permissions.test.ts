import { describe, expect, it } from 'vitest'
import {
  STATUS_TRANSITIONS,
  canAssignOthers,
  canChangeStatus,
  canComment,
  canSelfAssign,
  canTransition,
  canViewTicket,
  isStaff,
  visibleTicketsWhere,
  type Actor,
} from '@/lib/permissions'

const reporter: Actor = { id: 'u-claire', role: 'USER' }
const agent: Actor = { id: 'u-marc', role: 'AGENT' }
const admin: Actor = { id: 'u-nadia', role: 'ADMIN' }

describe('isStaff', () => {
  it('treats agents and admins as staff, reporters not', () => {
    expect(isStaff(agent)).toBe(true)
    expect(isStaff(admin)).toBe(true)
    expect(isStaff(reporter)).toBe(false)
  })
})

describe('visibleTicketsWhere', () => {
  it('does not restrict staff', () => {
    expect(visibleTicketsWhere(agent)).toEqual({})
    expect(visibleTicketsWhere(admin)).toEqual({})
  })

  it('restricts a reporter to the tickets they created', () => {
    expect(visibleTicketsWhere(reporter)).toEqual({ createdById: 'u-claire' })
  })

  it('never returns an empty filter for a reporter, whatever the id', () => {
    // Guards against a refactor that accidentally widens the scope.
    for (const id of ['', 'x', 'u-claire']) {
      expect(visibleTicketsWhere({ id, role: 'USER' })).toHaveProperty('createdById', id)
    }
  })
})

describe('canViewTicket', () => {
  it('lets a reporter see only their own ticket', () => {
    expect(canViewTicket(reporter, { createdById: 'u-claire' })).toBe(true)
    expect(canViewTicket(reporter, { createdById: 'u-samir' })).toBe(false)
  })

  it('lets staff see any ticket', () => {
    expect(canViewTicket(agent, { createdById: 'u-samir' })).toBe(true)
    expect(canViewTicket(admin, { createdById: 'u-samir' })).toBe(true)
  })
})

describe('canComment', () => {
  it('follows visibility: whoever may see a ticket may discuss it', () => {
    expect(canComment(reporter, { createdById: 'u-claire' })).toBe(true)
    expect(canComment(reporter, { createdById: 'u-samir' })).toBe(false)
    expect(canComment(agent, { createdById: 'u-samir' })).toBe(true)
  })
})

describe('workflow rights', () => {
  it('keeps status changes and assignment away from reporters', () => {
    expect(canChangeStatus(reporter)).toBe(false)
    expect(canSelfAssign(reporter)).toBe(false)
    expect(canChangeStatus(agent)).toBe(true)
    expect(canSelfAssign(agent)).toBe(true)
  })

  it('reserves reassigning someone else to admins', () => {
    expect(canAssignOthers(admin)).toBe(true)
    expect(canAssignOthers(agent)).toBe(false)
    expect(canAssignOthers(reporter)).toBe(false)
  })
})

describe('status transitions', () => {
  it('accepts the documented moves', () => {
    expect(canTransition('OPEN', 'IN_PROGRESS')).toBe(true)
    expect(canTransition('IN_PROGRESS', 'RESOLVED')).toBe(true)
    expect(canTransition('CLOSED', 'OPEN')).toBe(true)
  })

  it('rejects a jump straight from CLOSED to RESOLVED', () => {
    // The exact case the server action re-checks against a crafted POST.
    expect(canTransition('CLOSED', 'RESOLVED')).toBe(false)
  })

  it('never allows a status to transition to itself', () => {
    for (const status of Object.keys(STATUS_TRANSITIONS) as (keyof typeof STATUS_TRANSITIONS)[]) {
      expect(canTransition(status, status)).toBe(false)
    }
  })

  it('only ever targets known statuses', () => {
    const known = Object.keys(STATUS_TRANSITIONS)
    for (const targets of Object.values(STATUS_TRANSITIONS)) {
      for (const target of targets) expect(known).toContain(target)
    }
  })

  it('leaves every status reachable from somewhere', () => {
    const reachable = new Set(Object.values(STATUS_TRANSITIONS).flat())
    for (const status of Object.keys(STATUS_TRANSITIONS)) expect(reachable).toContain(status)
  })
})
