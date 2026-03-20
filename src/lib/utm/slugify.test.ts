import { describe, it, expect } from 'vitest'
import { slugify } from './slugify'

describe('slugify', () => {
  it('lowercases and replaces spaces', () => {
    expect(slugify('Paid Social')).toBe('paid-social')
  })
  it('strips special characters', () => {
    expect(slugify('Video/OTT')).toBe('video-ott')
  })
  it('collapses multiple hyphens', () => {
    expect(slugify('News  Feed')).toBe('news-feed')
  })
  it('trims leading/trailing hyphens', () => {
    expect(slugify(' Hello World ')).toBe('hello-world')
  })
})
