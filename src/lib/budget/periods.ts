import { addDays, differenceInDays, min } from 'date-fns'

export interface Period {
  start: Date
  end: Date
  type: 'weekly' | 'biweekly'
}

export function generatePeriods(campaignStart: Date, campaignEnd: Date): Period[] {
  const totalDays = differenceInDays(campaignEnd, campaignStart)
  const isLong = totalDays > 91
  const periodDays = isLong ? 14 : 7
  const type = isLong ? 'biweekly' : 'weekly'

  const periods: Period[] = []
  let current = campaignStart

  while (current <= campaignEnd) {
    const periodEnd = min([addDays(current, periodDays - 1), campaignEnd])
    periods.push({ start: new Date(current), end: new Date(periodEnd), type })
    current = addDays(periodEnd, 1)
  }

  return periods
}
