import { addMonths, differenceInDays, endOfMonth, max, min, startOfMonth } from 'date-fns'

export interface MonthBucket {
  start: Date
  end: Date
  key: string // 'YYYY-MM'
}

export function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

export function formatMonthLabel(key: string): string {
  const [year, month] = key.split('-').map(Number)
  return new Date(year, month - 1, 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

// Generates calendar-month buckets spanning [rangeStart, rangeEnd], clipping the
// first and last bucket to the range (mirrors generatePeriods in periods.ts).
export function generateMonths(rangeStart: Date, rangeEnd: Date): MonthBucket[] {
  const months: MonthBucket[] = []
  let current = startOfMonth(rangeStart)
  const last = startOfMonth(rangeEnd)

  while (current <= last) {
    const start = max([current, rangeStart])
    const end = min([endOfMonth(current), rangeEnd])
    months.push({ start, end, key: monthKey(current) })
    current = addMonths(current, 1)
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
