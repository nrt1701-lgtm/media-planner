import { differenceInDays, max, min } from 'date-fns'

export interface MonthBucket {
  start: Date
  end: Date
  key: string // 'YYYY-MM'
}

// All month bucketing below operates in UTC. Tactic flight dates are
// date-only ISO strings (e.g. '2027-01-01'), which `new Date(...)` parses as
// UTC midnight. Reading them back with local-time getters (getFullYear,
// getMonth) rolls the date back a calendar day in any negative-UTC-offset
// timezone (i.e. everywhere in the US), which silently shifts month
// boundaries — e.g. a Jan 1 flight_start reads as Dec 31 locally. Using the
// UTC getters/constructors throughout keeps every date anchored to the
// calendar day it was actually entered as.
export function monthKey(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`
}

export function formatMonthLabel(key: string): string {
  const [year, month] = key.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

function startOfMonthUTC(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1))
}

function endOfMonthUTC(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0))
}

function addMonthsUTC(date: Date, count: number): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + count, 1))
}

// Generates calendar-month buckets spanning [rangeStart, rangeEnd], clipping the
// first and last bucket to the range (mirrors generatePeriods in periods.ts).
export function generateMonths(rangeStart: Date, rangeEnd: Date): MonthBucket[] {
  const months: MonthBucket[] = []
  let current = startOfMonthUTC(rangeStart)
  const last = startOfMonthUTC(rangeEnd)

  while (current <= last) {
    const start = max([current, rangeStart])
    const end = min([endOfMonthUTC(current), rangeEnd])
    months.push({ start, end, key: monthKey(current) })
    current = addMonthsUTC(current, 1)
  }

  return months
}

export interface MonthAllocation {
  monthKey: string
  amount: number
}

// Calendar-month version of allocateBudget in allocate.ts (which buckets by
// week/biweek). Distributes a tactic's budget across months proportionally to
// how many days of its flight fall in each month, with the rounding remainder
// going to the last month it appears in.
export function allocateBudgetByMonth(
  budget: number,
  tacticStart: Date,
  tacticEnd: Date,
  months: MonthBucket[]
): MonthAllocation[] {
  const overlaps = months.map((m) => {
    const overlapStart = max([m.start, tacticStart])
    const overlapEnd = min([m.end, tacticEnd])
    const days = overlapStart <= overlapEnd ? differenceInDays(overlapEnd, overlapStart) + 1 : 0
    return { month: m, days }
  })

  const totalDays = overlaps.reduce((sum, o) => sum + o.days, 0)

  if (totalDays === 0) {
    return months.map((m) => ({ monthKey: m.key, amount: 0 }))
  }

  let allocated = 0
  return overlaps.map((o, i) => {
    const isLast = i === overlaps.length - 1 || overlaps.slice(i + 1).every((x) => x.days === 0)
    let amount: number

    if (isLast && o.days > 0) {
      amount = Math.round((budget - allocated) * 100) / 100
    } else {
      amount = Math.round((budget * o.days / totalDays) * 100) / 100
      allocated += amount
    }

    return { monthKey: o.month.key, amount: o.days > 0 ? amount : 0 }
  })
}
