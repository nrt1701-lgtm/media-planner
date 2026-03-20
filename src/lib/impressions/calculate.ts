import { type RateType } from '@/lib/constants'

export function calculateImpressions(budget: number, rate: number, rateType: RateType): number | null {
  if (rateType !== 'CPM' || rate === 0) return null
  return Math.round((budget / rate) * 1000)
}
