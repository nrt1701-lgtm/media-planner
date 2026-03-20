import { describe, it, expect } from 'vitest'
import { formatWorkamajigCode } from './format'

describe('formatWorkamajigCode', () => {
  it('formats a standard code', () => {
    expect(formatWorkamajigCode(2026, 'EKUB', '1234')).toBe('26-EKUB-1234')
  })
  it('pads expense number to 4 digits', () => {
    expect(formatWorkamajigCode(2026, 'EKUB', '42')).toBe('26-EKUB-0042')
  })
  it('uppercases client code', () => {
    expect(formatWorkamajigCode(2026, 'ekub', '1234')).toBe('26-EKUB-1234')
  })
  it('handles year 2030', () => {
    expect(formatWorkamajigCode(2030, 'ABC', '9999')).toBe('30-ABC-9999')
  })
})
