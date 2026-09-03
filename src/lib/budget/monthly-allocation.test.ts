import { describe, it, expect } from 'vitest'
import { generateMonths, allocateBudgetByMonth, monthKey } from './monthly-allocation'

describe('generateMonths', () => {
  it('generates one bucket per calendar month in the range', () => {
    const months = generateMonths(new Date('2026-04-01'), new Date('2026-06-30'))
    expect(months.map((m) => m.key)).toEqual(['2026-04', '2026-05', '2026-06'])
  })

  it('clips the first and last bucket to the range', () => {
    const months = generateMonths(new Date('2026-04-15'), new Date('2026-06-10'))
    expect(months[0].start).toEqual(new Date('2026-04-15'))
    expect(months[months.length - 1].end).toEqual(new Date('2026-06-10'))
  })

  it('handles a single-month range', () => {
    const months = generateMonths(new Date('2026-04-05'), new Date('2026-04-20'))
    expect(months).toHaveLength(1)
    expect(months[0].key).toBe('2026-04')
  })
})

describe('allocateBudgetByMonth', () => {
  const months = generateMonths(new Date('2026-04-01'), new Date('2026-06-30'))

  it('distributes evenly across full months of equal length weighting', () => {
    const allocs = allocateBudgetByMonth(3000, new Date('2026-04-01'), new Date('2026-06-30'), months)
    const total = allocs.reduce((sum, a) => sum + a.amount, 0)
    expect(total).toBe(3000)
    expect(allocs).toHaveLength(3)
  })

  it('puts the rounding remainder in the last month the tactic appears in', () => {
    const allocs = allocateBudgetByMonth(1000, new Date('2026-04-01'), new Date('2026-06-30'), months)
    const total = allocs.reduce((sum, a) => sum + a.amount, 0)
    expect(total).toBe(1000)
  })

  it('returns zero amounts for a tactic outside all months', () => {
    const allocs = allocateBudgetByMonth(1000, new Date('2026-08-01'), new Date('2026-08-07'), months)
    expect(allocs.every((a) => a.amount === 0)).toBe(true)
  })

  it('allocates entirely to a single month when the tactic only runs that month', () => {
    const allocs = allocateBudgetByMonth(500, new Date('2026-05-01'), new Date('2026-05-31'), months)
    const may = allocs.find((a) => a.monthKey === '2026-05')
    expect(may?.amount).toBe(500)
    expect(allocs.filter((a) => a.monthKey !== '2026-05').every((a) => a.amount === 0)).toBe(true)
  })
})

describe('monthKey', () => {
  it('formats as YYYY-MM', () => {
    expect(monthKey(new Date('2026-01-15'))).toBe('2026-01')
    expect(monthKey(new Date('2026-11-01'))).toBe('2026-11')
  })

  // Regression test: flight dates are date-only ISO strings, parsed as UTC
  // midnight. Reading them with local-time getters in a negative-UTC-offset
  // timezone (any US timezone) rolls a month-1 date back to the previous
  // month/year — e.g. this would return '2026-12' under the old
  // getFullYear()/getMonth() implementation when run with TZ=America/Chicago.
  it('is not affected by the local timezone (UTC-anchored)', () => {
    expect(monthKey(new Date('2027-01-01'))).toBe('2027-01')
  })
})
