import { describe, it, expect } from 'vitest'
import { toGross, toNet } from './markup'

describe('toGross', () => {
  it('adds the markup percentage on top of net cost', () => {
    expect(toGross(1000, 20)).toBe(1200)
  })

  it('returns net unchanged at 0% markup', () => {
    expect(toGross(1000, 0)).toBe(1000)
  })

  it('rounds to the nearest cent', () => {
    expect(toGross(100, 12.5)).toBe(112.5)
    expect(toGross(33.33, 15)).toBe(38.33)
  })
})

describe('toNet', () => {
  it('is the inverse of toGross', () => {
    expect(toNet(toGross(1000, 20), 20)).toBe(1000)
  })

  it('returns gross unchanged at 0% markup', () => {
    expect(toNet(1000, 0)).toBe(1000)
  })
})
