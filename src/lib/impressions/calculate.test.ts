import { describe, it, expect } from 'vitest'
import { calculateImpressions } from './calculate'

describe('calculateImpressions', () => {
  it('calculates CPM impressions', () => {
    expect(calculateImpressions(5000, 10, 'CPM')).toBe(500000)
  })
  it('returns null for non-CPM', () => {
    expect(calculateImpressions(5000, 2, 'CPC')).toBeNull()
  })
  it('returns null when rate is 0', () => {
    expect(calculateImpressions(5000, 0, 'CPM')).toBeNull()
  })
})
