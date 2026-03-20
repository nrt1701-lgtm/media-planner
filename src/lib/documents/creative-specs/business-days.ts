import { subDays } from 'date-fns'

export function subtractBusinessDays(date: Date, days: number): Date {
  let result = new Date(date)
  let remaining = days
  while (remaining > 0) {
    result = subDays(result, 1)
    const day = result.getUTCDay()
    if (day !== 0 && day !== 6) remaining--
  }
  return result
}
