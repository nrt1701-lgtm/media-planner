import { describe, it, expect } from 'vitest'
import { interpolateUtm } from './interpolate'

describe('interpolateUtm', () => {
  it('replaces variable tokens', () => {
    const result = interpolateUtm('{platform}_{channel_slug}', {
      platform: 'meta',
      channel_slug: 'paid-social',
    })
    expect(result).toBe('meta_paid-social')
  })
  it('leaves unknown vars as empty string', () => {
    expect(interpolateUtm('{unknown}', {})).toBe('')
  })
  it('handles multiple occurrences', () => {
    expect(interpolateUtm('{a}-{a}', { a: 'x' })).toBe('x-x')
  })
})
