import { FUNNEL_STAGES } from '@/lib/constants'

// The four dimensions the Budget Summary can be filtered and pivoted by.
// `audience` is keyed by tactics.audience_id (a UUID) rather than by the
// audience name, so a rename in the Audience tab doesn't invalidate a saved
// or shared filter URL. Every other dimension is keyed by its literal value.
export const PIVOT_DIMENSIONS = [
  { value: 'channel', label: 'Channel', param: 'channel' },
  { value: 'platform', label: 'Platform', param: 'platform' },
  { value: 'funnel_stage', label: 'Funnel Stage', param: 'funnel' },
  { value: 'audience', label: 'Audience', param: 'audience' },
] as const

export type PivotDimension = (typeof PIVOT_DIMENSIONS)[number]['value']

export const PIVOT_DIMENSION_VALUES = PIVOT_DIMENSIONS.map((d) => d.value) as readonly PivotDimension[]

export const DEFAULT_GROUP_BY: PivotDimension = 'channel'

// Sentinel key for tactics with no value on a dimension. Using one shared
// bucket (rather than dropping the rows) keeps every chart's total equal to
// the filtered spend, so the KPI strip and the charts can never disagree.
export const UNASSIGNED = 'Unassigned'

export function isPivotDimension(value: string | null | undefined): value is PivotDimension {
  return value != null && (PIVOT_DIMENSION_VALUES as readonly string[]).includes(value)
}

export function dimensionLabel(dimension: PivotDimension): string {
  return PIVOT_DIMENSIONS.find((d) => d.value === dimension)!.label
}

export function dimensionParam(dimension: PivotDimension): string {
  return PIVOT_DIMENSIONS.find((d) => d.value === dimension)!.param
}

export interface FilterableTactic {
  id?: string
  channel?: string | null
  platform?: string | null
  funnel_stage?: string | null
  audience_id?: string | null
  budget?: number | null
}

// A filter with an empty array means "no constraint on this dimension" — not
// "match nothing". That makes an absent URL param and an empty selection the
// same thing, so the state round-trips through the query string cleanly.
export type BudgetFilters = Record<PivotDimension, string[]>

export const EMPTY_FILTERS: BudgetFilters = {
  channel: [],
  platform: [],
  funnel_stage: [],
  audience: [],
}

export function hasAnyFilter(filters: BudgetFilters): boolean {
  return PIVOT_DIMENSION_VALUES.some((d) => filters[d].length > 0)
}

export function countActiveFilters(filters: BudgetFilters): number {
  return PIVOT_DIMENSION_VALUES.reduce((sum, d) => sum + filters[d].length, 0)
}

/**
 * The grouping/matching key for a tactic on a dimension. Null, undefined and
 * whitespace-only values all collapse into the UNASSIGNED bucket.
 */
export function getDimensionKey(tactic: FilterableTactic, dimension: PivotDimension): string {
  const raw =
    dimension === 'channel' ? tactic.channel
    : dimension === 'platform' ? tactic.platform
    : dimension === 'funnel_stage' ? tactic.funnel_stage
    : tactic.audience_id

  const trimmed = typeof raw === 'string' ? raw.trim() : ''
  return trimmed === '' ? UNASSIGNED : trimmed
}

/**
 * The human-readable label for a dimension key. Only `audience` differs from
 * its key: it resolves the UUID through the campaign's audience list. An
 * audience_id with no matching audience row (deleted out from under the
 * tactic) falls back to UNASSIGNED rather than rendering a raw UUID.
 */
export function getDimensionLabel(
  key: string,
  dimension: PivotDimension,
  audienceNameById: Map<string, string> = new Map()
): string {
  if (dimension !== 'audience' || key === UNASSIGNED) return key
  return audienceNameById.get(key) ?? UNASSIGNED
}

/**
 * Collapses `audience_id` values that no longer resolve to an audience row
 * (the audience was deleted out from under the tactic) down to null, so they
 * share the single UNASSIGNED bucket instead of forming a second group that
 * also renders as "Unassigned" — a duplicate slice and legend entry.
 *
 * Run this once, before filtering or grouping, so every consumer agrees on
 * what a tactic's audience key is. `knownAudienceIds` of null means the
 * audience list hasn't loaded yet: leave the ids alone rather than briefly
 * collapsing every audience into Unassigned and snapping back on load.
 */
export function normalizeTactics<T extends FilterableTactic>(
  tactics: T[],
  knownAudienceIds: ReadonlySet<string> | null
): T[] {
  if (knownAudienceIds == null) return tactics

  return tactics.map((tactic) => {
    const id = tactic.audience_id?.trim()
    if (!id || knownAudienceIds.has(id)) return tactic
    return { ...tactic, audience_id: null }
  })
}

/**
 * Filters are AND-ed across dimensions and OR-ed within one: selecting two
 * channels and one funnel stage yields tactics in (channel A OR channel B)
 * AND that funnel stage.
 */
export function applyFilters<T extends FilterableTactic>(tactics: T[], filters: BudgetFilters): T[] {
  if (!hasAnyFilter(filters)) return tactics

  return tactics.filter((tactic) =>
    PIVOT_DIMENSION_VALUES.every((dimension) => {
      const selected = filters[dimension]
      if (selected.length === 0) return true
      return selected.includes(getDimensionKey(tactic, dimension))
    })
  )
}

export interface FacetOption {
  key: string
  label: string
  count: number
  budget: number
}

/**
 * Options for one dimension's filter control, derived from the tactic data
 * rather than from the reference tables — so a filter never offers a choice
 * that would return zero rows.
 *
 * Counts are cross-filtered: they reflect the other three dimensions'
 * selections but not this dimension's own, which is what makes a multi-select
 * facet readable (each option shows what adding it would contribute).
 */
export function getFacetOptions(
  tactics: FilterableTactic[],
  dimension: PivotDimension,
  filters: BudgetFilters,
  audienceNameById?: Map<string, string>
): FacetOption[] {
  const crossFiltered = applyFilters(tactics, { ...filters, [dimension]: [] })

  const buckets = new Map<string, { count: number; budget: number }>()
  for (const tactic of crossFiltered) {
    const key = getDimensionKey(tactic, dimension)
    const bucket = buckets.get(key) ?? { count: 0, budget: 0 }
    bucket.count += 1
    bucket.budget += tactic.budget ?? 0
    buckets.set(key, bucket)
  }

  // A value that is currently selected but cross-filtered out of existence
  // still needs a row, otherwise the only control that can clear it vanishes.
  for (const key of filters[dimension]) {
    if (!buckets.has(key)) buckets.set(key, { count: 0, budget: 0 })
  }

  return Array.from(buckets.entries())
    .map(([key, { count, budget }]) => ({
      key,
      label: getDimensionLabel(key, dimension, audienceNameById),
      count,
      budget,
    }))
    .sort(sortByDimensionOrder(dimension))
}

export interface DimensionGroup {
  key: string
  name: string
  budget: number
  count: number
}

/**
 * Sums budget per dimension value. Feeds both the bar chart (dollars) and the
 * mix donut (share of filtered total).
 */
export function groupByDimension(
  tactics: FilterableTactic[],
  dimension: PivotDimension,
  audienceNameById?: Map<string, string>
): DimensionGroup[] {
  const buckets = new Map<string, { budget: number; count: number }>()
  for (const tactic of tactics) {
    const key = getDimensionKey(tactic, dimension)
    const bucket = buckets.get(key) ?? { budget: 0, count: 0 }
    bucket.budget += tactic.budget ?? 0
    bucket.count += 1
    buckets.set(key, bucket)
  }

  return Array.from(buckets.entries())
    .map(([key, { budget, count }]) => ({
      key,
      name: getDimensionLabel(key, dimension, audienceNameById),
      budget,
      count,
    }))
    .sort((a, b) => b.budget - a.budget || a.name.localeCompare(b.name))
}

export function totalBudget(tactics: FilterableTactic[]): number {
  return tactics.reduce((sum, t) => sum + (t.budget ?? 0), 0)
}

// Funnel stages read as a pipeline, so they sort in funnel order rather than
// alphabetically or by spend. Every other dimension sorts by spend, biggest
// first, with UNASSIGNED pinned last so it never leads the list.
function sortByDimensionOrder(dimension: PivotDimension) {
  return (a: FacetOption, b: FacetOption) => {
    if (a.key === UNASSIGNED) return 1
    if (b.key === UNASSIGNED) return -1

    if (dimension === 'funnel_stage') {
      const order = FUNNEL_STAGES as readonly string[]
      return order.indexOf(a.key) - order.indexOf(b.key)
    }

    return b.budget - a.budget || a.label.localeCompare(b.label)
  }
}
