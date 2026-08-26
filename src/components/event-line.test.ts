import { describe, expect, it } from 'vitest'
import { describeEvent, type WireEvent } from '@/components/event-line'

const marc = { id: 'u-marc', name: 'Marc Lefèvre' }
const nadia = { id: 'u-nadia', name: 'Nadia Bensalem' }

const event = (over: Partial<WireEvent>): WireEvent => ({
  id: 'e1',
  type: 'CREATED',
  createdAt: '2026-08-26T12:00:00.000Z',
  fromStatus: null,
  toStatus: null,
  actor: marc,
  targetUser: null,
  ...over,
})

describe('describeEvent', () => {
  it('describes creation', () => {
    expect(describeEvent(event({ type: 'CREATED' }))).toBe('Marc Lefèvre a ouvert le ticket')
  })

  it('spells out both ends of a status change', () => {
    const text = describeEvent(
      event({ type: 'STATUS_CHANGED', fromStatus: 'OPEN', toStatus: 'IN_PROGRESS' }),
    )
    expect(text).toContain('Ouvert')
    expect(text).toContain('En cours')
  })

  it('falls back gracefully when a status is missing', () => {
    expect(describeEvent(event({ type: 'STATUS_CHANGED' }))).toContain('—')
  })

  it('distinguishes taking a ticket from assigning it to someone else', () => {
    expect(describeEvent(event({ type: 'ASSIGNED', targetUser: marc }))).toBe(
      'Marc Lefèvre a pris le ticket en charge',
    )
    expect(describeEvent(event({ type: 'ASSIGNED', actor: nadia, targetUser: marc }))).toBe(
      'Nadia Bensalem a assigné le ticket à Marc Lefèvre',
    )
  })

  it('distinguishes stepping back from removing someone else', () => {
    expect(describeEvent(event({ type: 'UNASSIGNED', targetUser: marc }))).toContain('retiré du')
    expect(describeEvent(event({ type: 'UNASSIGNED', actor: nadia, targetUser: marc }))).toBe(
      'Nadia Bensalem a retiré Marc Lefèvre du ticket',
    )
  })

  it('still reads correctly when the target user was deleted', () => {
    // targetUserId is ON DELETE SET NULL, so this shape is reachable.
    expect(describeEvent(event({ type: 'UNASSIGNED', actor: nadia, targetUser: null }))).toBe(
      'Nadia Bensalem a désassigné le ticket',
    )
  })
})
