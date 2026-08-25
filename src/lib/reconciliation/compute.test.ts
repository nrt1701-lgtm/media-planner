import { describe, it, expect } from 'vitest'
import { buildReconciliationGrid } from './compute'

describe('buildReconciliationGrid', () => {
  const tactics = [
    { platform: 'Meta', budget: 3000, flight_start: '2026-04-01', flight_end: '2026-06-30' },
    { platform: 'The Trade Desk', budget: 1500, flight_start: '2026-05-01', flight_end: '2026-05-31' },
  ]

  it('returns one row per distinct platform, sorted', () => {
    const grid = buildReconciliationGrid(tactics, [], new Date('2026-04-01'))
    expect(grid.platforms.map((p) => p.platform)).toEqual(['Meta', 'The Trade Desk'])
  })

  it('spans months from the earliest to the latest tactic flight date', () => {
    const grid = buildReconciliationGrid(tactics, [], new Date('2026-04-01'))
    expect(grid.months.map((m) => m.key)).toEqual(['2026-04', '2026-05', '2026-06'])
  })

  it('ignores tactics missing platform, budget, or flight dates', () => {
    const grid = buildReconciliationGrid(
      [...tactics, { platform: null, budget: 500, flight_start: '2026-04-01', flight_end: '2026-04-30' }],
      [],
      new Date('2026-04-01')
    )
    expect(grid.platforms.map((p) => p.platform)).toEqual(['Meta', 'The Trade Desk'])
  })

  it('projects needed spend as an even split of total budget across all months when no actuals entered yet', () => {
    const grid = buildReconciliationGrid(tactics, [], new Date('2026-04-01'))
    const meta = grid.platforms.find((p) => p.platform === 'Meta')!
    expect(meta.totalPlanned).toBe(3000)
    expect(meta.actualToDate).toBe(0)
    // 3 remaining months (Apr, May, Jun) since "today" is April and nothing entered yet
    meta.months.forEach((m) => expect(m.needed).toBe(1000))
  })

  it('recalculates needed spend for remaining months after an actual is entered for the previous month', () => {
    const actuals = [{ platform: 'Meta', month: '2026-04-01', actual_spend: 1400 }]
    const grid = buildReconciliationGrid(tactics, actuals, new Date('2026-05-01'))
    const meta = grid.platforms.find((p) => p.platform === 'Meta')!

    const april = meta.months.find((m) => m.monthKey === '2026-04')!
    expect(april.actual).toBe(1400)
    expect(april.needed).toBeNull()
    expect(april.isPast).toBe(true)
    expect(april.isEditable).toBe(true)

    // Remaining budget (3000 - 1400 = 1600) split evenly across May + June
    const may = meta.months.find((m) => m.monthKey === '2026-05')!
    const june = meta.months.find((m) => m.monthKey === '2026-06')!
    expect(may.needed).toBe(800)
    expect(june.needed).toBe(800)
  })

  it('clamps remaining budget to zero when actuals already exceed the total plan', () => {
    const actuals = [{ platform: 'Meta', month: '2026-04-01', actual_spend: 5000 }]
    const grid = buildReconciliationGrid(tactics, actuals, new Date('2026-05-01'))
    const meta = grid.platforms.find((p) => p.platform === 'Meta')!
    expect(meta.remainingBudget).toBe(0)
    const june = meta.months.find((m) => m.monthKey === '2026-06')!
    expect(june.needed).toBe(0)
  })

  it('returns an empty grid when there are no usable tactics', () => {
    const grid = buildReconciliationGrid([], [], new Date('2026-04-01'))
    expect(grid.months).toEqual([])
    expect(grid.platforms).toEqual([])
  })
})
