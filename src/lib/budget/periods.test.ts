import { describe, it, expect } from 'vitest'
import { generatePeriods } from './periods'

describe('generatePeriods', () => {
  it('generates weekly periods for campaigns <= 3 months', () => {
    const periods = generatePeriods(new Date('2026-04-01'), new Date('2026-06-30'))
    expect(periods[0].type).toBe('weekly')
    expect(periods.length).toBe(13)
    expect(periods[0].start).toEqual(new Date('2026-04-01'))
  })
  it('generates biweekly periods for campaigns > 3 months', () => {
    const periods = generatePeriods(new Date('2026-01-01'), new Date('2026-06-30'))
    expect(periods[0].type).toBe('biweekly')
    expect(periods.length).toBeGreaterThan(0)
    const firstPeriodDays = (periods[0].end.getTime() - periods[0].start.getTime()) / (1000 * 60 * 60 * 24)
    expect(firstPeriodDays).toBeLessThanOrEqual(14)
  })
  it('handles single-day campaign', () => {
    const periods = generatePeriods(new Date('2026-04-01'), new Date('2026-04-01'))
    expect(periods.length).toBe(1)
  })
  it('last period ends on campaign end date', () => {
    const periods = generatePeriods(new Date('2026-04-01'), new Date('2026-06-15'))
    const lastPeriod = periods[periods.length - 1]
    expect(lastPeriod.end).toEqual(new Date('2026-06-15'))
  })
})
