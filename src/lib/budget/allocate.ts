import { differenceInDays, max, min } from 'date-fns'
import { type Period } from './periods'

export interface PeriodAllocation {
  periodStart: Date
  periodEnd: Date
  amount: number
}

export function allocateBudget(
  budget: number,
  tacticStart: Date,
  tacticEnd: Date,
  periods: Period[]
): PeriodAllocation[] {
  const overlaps = periods.map(p => {
    const overlapStart = max([p.start, tacticStart])
    const overlapEnd = min([p.end, tacticEnd])
    const days = overlapStart <= overlapEnd ? differenceInDays(overlapEnd, overlapStart) + 1 : 0
    return { period: p, days }
  })

  const totalDays = overlaps.reduce((sum, o) => sum + o.days, 0)

  if (totalDays === 0) {
    return periods.map(p => ({ periodStart: p.start, periodEnd: p.end, amount: 0 }))
  }

  let allocated = 0
  const allocations = overlaps.map((o, i) => {
    const isLast = i === overlaps.length - 1 || overlaps.slice(i + 1).every(x => x.days === 0)
    let amount: number

    if (isLast && o.days > 0) {
      amount = Math.round((budget - allocated) * 100) / 100
    } else {
      amount = Math.round((budget * o.days / totalDays) * 100) / 100
      allocated += amount
    }

    return {
      periodStart: o.period.start,
      periodEnd: o.period.end,
      amount: o.days > 0 ? amount : 0,
    }
  })

  return allocations
}
