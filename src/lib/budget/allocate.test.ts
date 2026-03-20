import { describe, it, expect } from 'vitest'
import { allocateBudget } from './allocate'
import { type Period } from './periods'

describe('allocateBudget', () => {
  const periods: Period[] = [
    { start: new Date('2026-04-01'), end: new Date('2026-04-07'), type: 'weekly' },
    { start: new Date('2026-04-08'), end: new Date('2026-04-14'), type: 'weekly' },
    { start: new Date('2026-04-15'), end: new Date('2026-04-21'), type: 'weekly' },
  ]

  it('distributes evenly across full periods', () => {
    const allocs = allocateBudget(3000, new Date('2026-04-01'), new Date('2026-04-21'), periods)
    expect(allocs).toHaveLength(3)
    expect(allocs[0].amount).toBe(1000)
    expect(allocs[1].amount).toBe(1000)
    expect(allocs[2].amount).toBe(1000)
  })

  it('handles partial first period proportionally', () => {
    const allocs = allocateBudget(1700, new Date('2026-04-05'), new Date('2026-04-21'), periods)
    expect(allocs).toHaveLength(3)
    const total = allocs.reduce((sum, a) => sum + a.amount, 0)
    expect(total).toBe(1700)
    expect(allocs[0].amount).toBeLessThan(allocs[1].amount)
  })

  it('puts rounding remainder in last period', () => {
    const allocs = allocateBudget(1000, new Date('2026-04-01'), new Date('2026-04-21'), periods)
    const total = allocs.reduce((sum, a) => sum + a.amount, 0)
    expect(total).toBe(1000)
  })

  it('returns zero amounts for tactic outside all periods', () => {
    const allocs = allocateBudget(1000, new Date('2026-05-01'), new Date('2026-05-07'), periods)
    expect(allocs).toHaveLength(3)
    expect(allocs.every(a => a.amount === 0)).toBe(true)
  })
})
