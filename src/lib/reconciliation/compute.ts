import { generateMonths, allocateBudgetByMonth, monthKey, formatMonthLabel, type MonthBucket } from '@/lib/budget/monthly-allocation'

export interface ReconciliationTactic {
  platform?: string | null
  budget?: number | null
  flight_start?: string | null
  flight_end?: string | null
}

export interface PlatformActual {
  platform: string
  month: string // 'YYYY-MM-01' (or any ISO date within the month)
  actual_spend: number
}

export interface MonthCell {
  monthKey: string
  label: string
  planned: number
  actual: number | null
  needed: number | null
  isPast: boolean
  isEditable: boolean
}

export interface PlatformRow {
  platform: string
  months: MonthCell[]
  totalPlanned: number
  actualToDate: number
  remainingBudget: number
}

export interface ReconciliationGrid {
  months: MonthBucket[]
  platforms: PlatformRow[]
}

// Guards against a single malformed date (e.g. a mistyped year like
// '0027-01-01') stretching the whole grid's date range across centuries.
// The range is computed as min/max across every tactic's flight dates, so
// one bad row would otherwise silently poison the entire advertiser's view.
function isPlausibleFlightDate(dateStr: string): boolean {
  const year = new Date(dateStr).getUTCFullYear()
  return year >= 1970 && year <= 2100
}

// Builds the platform x month reconciliation grid: planned spend (allocated
// from tactic budgets, day-weighted per calendar month), entered actuals for
// past months, and an even split of the remaining budget across the months
// after the latest entered actual (or from the current month on, if none
// have been entered yet).
export function buildReconciliationGrid(
  tactics: ReconciliationTactic[],
  actuals: PlatformActual[],
  today: Date = new Date()
): ReconciliationGrid {
  const valid = tactics.flatMap((t) =>
    t.platform &&
    t.budget &&
    t.flight_start &&
    t.flight_end &&
    isPlausibleFlightDate(t.flight_start) &&
    isPlausibleFlightDate(t.flight_end)
      ? [{ platform: t.platform, budget: t.budget, flight_start: t.flight_start, flight_end: t.flight_end }]
      : []
  )
  if (valid.length === 0) return { months: [], platforms: [] }

  const rangeStart = new Date(Math.min(...valid.map((t) => new Date(t.flight_start).getTime())))
  const rangeEnd = new Date(Math.max(...valid.map((t) => new Date(t.flight_end).getTime())))
  const months = generateMonths(rangeStart, rangeEnd)
  const currentMonthKey = monthKey(today)

  const actualsByPlatformMonth = new Map<string, number>()
  for (const a of actuals) {
    actualsByPlatformMonth.set(`${a.platform}::${a.month.slice(0, 7)}`, a.actual_spend)
  }

  const platformNames = Array.from(new Set(valid.map((t) => t.platform))).sort()

  const platforms: PlatformRow[] = platformNames.map((platform) => {
    const platformTactics = valid.filter((t) => t.platform === platform)

    const plannedByMonth = new Map<string, number>(months.map((m) => [m.key, 0]))
    for (const t of platformTactics) {
      const allocs = allocateBudgetByMonth(t.budget, new Date(t.flight_start), new Date(t.flight_end), months)
      for (const a of allocs) {
        plannedByMonth.set(a.monthKey, (plannedByMonth.get(a.monthKey) ?? 0) + a.amount)
      }
    }

    const totalPlanned = platformTactics.reduce((sum, t) => sum + t.budget, 0)

    const monthsWithActuals = months.filter((m) => actualsByPlatformMonth.has(`${platform}::${m.key}`))
    const actualToDate = monthsWithActuals.reduce(
      (sum, m) => sum + actualsByPlatformMonth.get(`${platform}::${m.key}`)!,
      0
    )

    const lastActualKey = monthsWithActuals.length > 0
      ? monthsWithActuals[monthsWithActuals.length - 1].key
      : null
    const remainingMonths = months.filter((m) =>
      lastActualKey ? m.key > lastActualKey : m.key >= currentMonthKey
    )

    const remainingBudget = Math.max(totalPlanned - actualToDate, 0)
    const neededPerMonth = remainingMonths.length > 0
      ? Math.round((remainingBudget / remainingMonths.length) * 100) / 100
      : 0

    const monthCells: MonthCell[] = months.map((m) => {
      const key = `${platform}::${m.key}`
      const hasActual = actualsByPlatformMonth.has(key)
      const isRemaining = remainingMonths.some((rm) => rm.key === m.key)
      return {
        monthKey: m.key,
        label: formatMonthLabel(m.key),
        planned: plannedByMonth.get(m.key) ?? 0,
        actual: hasActual ? actualsByPlatformMonth.get(key)! : null,
        needed: isRemaining ? neededPerMonth : null,
        isPast: m.key < currentMonthKey,
        isEditable: m.key <= currentMonthKey,
      }
    })

    return { platform, months: monthCells, totalPlanned, actualToDate, remainingBudget }
  })

  return { months, platforms }
}
