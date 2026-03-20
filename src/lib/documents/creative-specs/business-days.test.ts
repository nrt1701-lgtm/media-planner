import { describe, it, expect } from 'vitest'
import { subtractBusinessDays } from './business-days'

describe('subtractBusinessDays', () => {
  it('subtracts 10 business days (2 weeks)', () => {
    const result = subtractBusinessDays(new Date('2026-04-20'), 10)
    expect(result).toEqual(new Date('2026-04-06'))
  })
  it('skips weekends', () => {
    const result = subtractBusinessDays(new Date('2026-04-06'), 1)
    expect(result).toEqual(new Date('2026-04-03'))
  })
})
