import { describe, it, expect } from 'vitest'
import {
  EMPTY_FILTERS,
  UNASSIGNED,
  applyFilters,
  countActiveFilters,
  getDimensionKey,
  getDimensionLabel,
  getFacetOptions,
  groupByDimension,
  hasAnyFilter,
  isPivotDimension,
  normalizeTactics,
  totalBudget,
  type BudgetFilters,
  type FilterableTactic,
} from './filters'

const AUD_A = '11111111-1111-4111-8111-111111111111'
const AUD_B = '22222222-2222-4222-8222-222222222222'
const AUD_GONE = '33333333-3333-4333-8333-333333333333'

const audienceNames = new Map([
  [AUD_A, 'Homeowners 35-54'],
  [AUD_B, 'In-Market Movers'],
])

const tactics: FilterableTactic[] = [
  { id: 't1', channel: 'Paid Social', platform: 'Meta',    funnel_stage: 'Awareness',     audience_id: AUD_A, budget: 10000 },
  { id: 't2', channel: 'Paid Social', platform: 'TikTok',  funnel_stage: 'Consideration', audience_id: AUD_B, budget: 5000 },
  { id: 't3', channel: 'Programmatic Display', platform: 'DV360', funnel_stage: 'Awareness', audience_id: AUD_A, budget: 20000 },
  { id: 't4', channel: 'Paid Search', platform: 'Google',  funnel_stage: 'Conversion',    audience_id: null,  budget: 8000 },
  { id: 't5', channel: null,          platform: '   ',     funnel_stage: null,            audience_id: AUD_GONE, budget: 2000 },
]

const knownAudienceIds = new Set([AUD_A, AUD_B])

// The real pipeline normalizes before it filters or groups; AUD_GONE points
// at an audience that no longer exists.
const normalized = normalizeTactics(tactics, knownAudienceIds)

function withFilters(partial: Partial<BudgetFilters>): BudgetFilters {
  return { ...EMPTY_FILTERS, ...partial }
}

describe('getDimensionKey', () => {
  it('reads the column matching each dimension', () => {
    expect(getDimensionKey(tactics[0], 'channel')).toBe('Paid Social')
    expect(getDimensionKey(tactics[0], 'platform')).toBe('Meta')
    expect(getDimensionKey(tactics[0], 'funnel_stage')).toBe('Awareness')
    expect(getDimensionKey(tactics[0], 'audience')).toBe(AUD_A)
  })

  it('collapses null, undefined and whitespace into one Unassigned bucket', () => {
    expect(getDimensionKey(tactics[4], 'channel')).toBe(UNASSIGNED)
    expect(getDimensionKey(tactics[4], 'platform')).toBe(UNASSIGNED)
    expect(getDimensionKey(tactics[4], 'funnel_stage')).toBe(UNASSIGNED)
    expect(getDimensionKey({}, 'audience')).toBe(UNASSIGNED)
  })
})

describe('getDimensionLabel', () => {
  it('resolves an audience id to its name', () => {
    expect(getDimensionLabel(AUD_A, 'audience', audienceNames)).toBe('Homeowners 35-54')
  })

  it('falls back to Unassigned for an audience id with no matching row', () => {
    expect(getDimensionLabel(AUD_GONE, 'audience', audienceNames)).toBe(UNASSIGNED)
  })

  it('passes non-audience keys through unchanged', () => {
    expect(getDimensionLabel('Paid Social', 'channel', audienceNames)).toBe('Paid Social')
    expect(getDimensionLabel(UNASSIGNED, 'audience', audienceNames)).toBe(UNASSIGNED)
  })
})

describe('applyFilters', () => {
  it('returns every tactic when nothing is selected', () => {
    expect(applyFilters(tactics, EMPTY_FILTERS)).toHaveLength(5)
    expect(hasAnyFilter(EMPTY_FILTERS)).toBe(false)
  })

  it('ORs multiple values within one dimension', () => {
    const result = applyFilters(tactics, withFilters({ channel: ['Paid Social', 'Paid Search'] }))
    expect(result.map((t) => t.id)).toEqual(['t1', 't2', 't4'])
  })

  it('ANDs across dimensions', () => {
    const result = applyFilters(
      tactics,
      withFilters({ channel: ['Paid Social'], funnel_stage: ['Awareness'] })
    )
    expect(result.map((t) => t.id)).toEqual(['t1'])
  })

  it('filters audiences by id, not by name', () => {
    const result = applyFilters(tactics, withFilters({ audience: [AUD_A] }))
    expect(result.map((t) => t.id)).toEqual(['t1', 't3'])
  })

  it('matches unassigned rows via the Unassigned key', () => {
    expect(applyFilters(tactics, withFilters({ channel: [UNASSIGNED] })).map((t) => t.id)).toEqual(['t5'])
    expect(applyFilters(tactics, withFilters({ audience: [UNASSIGNED] })).map((t) => t.id)).toEqual(['t4'])
  })

  it('returns nothing when the combination excludes everything', () => {
    const result = applyFilters(
      tactics,
      withFilters({ channel: ['Paid Search'], funnel_stage: ['Awareness'] })
    )
    expect(result).toHaveLength(0)
  })
})

describe('groupByDimension', () => {
  it('sums budget per value and sorts by spend descending', () => {
    const groups = groupByDimension(tactics, 'channel')
    expect(groups.map((g) => [g.name, g.budget])).toEqual([
      ['Programmatic Display', 20000],
      ['Paid Social', 15000],
      ['Paid Search', 8000],
      [UNASSIGNED, 2000],
    ])
  })

  it('labels audience groups by name and merges dangling ids into Unassigned', () => {
    const groups = groupByDimension(normalized, 'audience', audienceNames)
    const byName = Object.fromEntries(groups.map((g) => [g.name, g.budget]))
    expect(byName['Homeowners 35-54']).toBe(30000)
    expect(byName['In-Market Movers']).toBe(5000)
    // t4 (null audience) and t5 (deleted audience) both land in Unassigned.
    expect(byName[UNASSIGNED]).toBe(10000)
  })

  it('never emits two groups sharing the Unassigned label', () => {
    const groups = groupByDimension(normalized, 'audience', audienceNames)
    expect(groups.filter((g) => g.name === UNASSIGNED)).toHaveLength(1)
  })

  it('treats a missing budget as zero', () => {
    const groups = groupByDimension([{ channel: 'Paid Social' }], 'channel')
    expect(groups[0].budget).toBe(0)
    expect(groups[0].count).toBe(1)
  })

  it('group totals equal the filtered total on every dimension', () => {
    const filtered = applyFilters(tactics, withFilters({ channel: ['Paid Social'] }))
    for (const dim of ['channel', 'platform', 'funnel_stage', 'audience'] as const) {
      const sum = groupByDimension(filtered, dim).reduce((s, g) => s + g.budget, 0)
      expect(sum).toBe(totalBudget(filtered))
    }
  })
})

describe('getFacetOptions', () => {
  it('derives options from the data, never offering an empty choice', () => {
    const options = getFacetOptions(tactics, 'channel', EMPTY_FILTERS)
    expect(options.map((o) => o.key)).toEqual([
      'Programmatic Display',
      'Paid Social',
      'Paid Search',
      UNASSIGNED,
    ])
    expect(options.every((o) => o.count > 0)).toBe(true)
  })

  it('cross-filters counts by the other dimensions but not by its own', () => {
    const filters = withFilters({ channel: ['Paid Social'], funnel_stage: ['Awareness'] })

    // Channel options ignore the channel selection, so Programmatic Display
    // still shows — it is what selecting it would add to the Awareness view.
    const channelOptions = getFacetOptions(tactics, 'channel', filters)
    expect(channelOptions.map((o) => o.key)).toContain('Programmatic Display')
    expect(channelOptions.find((o) => o.key === 'Programmatic Display')?.budget).toBe(20000)
    expect(channelOptions.map((o) => o.key)).not.toContain('Paid Search')

    // Funnel options respect the channel selection.
    const funnelOptions = getFacetOptions(tactics, 'funnel_stage', filters)
    expect(funnelOptions.map((o) => o.key)).toEqual(['Awareness', 'Consideration'])
  })

  it('keeps a selected value visible even when cross-filtered to zero', () => {
    const filters = withFilters({ channel: ['Paid Search'], platform: ['Meta'] })
    const platformOptions = getFacetOptions(tactics, 'platform', filters)
    const meta = platformOptions.find((o) => o.key === 'Meta')
    expect(meta).toBeDefined()
    expect(meta?.count).toBe(0)
  })

  it('sorts funnel stages in funnel order, not by spend', () => {
    const options = getFacetOptions(tactics, 'funnel_stage', EMPTY_FILTERS)
    expect(options.map((o) => o.key)).toEqual([
      'Awareness',
      'Consideration',
      'Conversion',
      UNASSIGNED,
    ])
  })

  it('labels audience options by name', () => {
    const options = getFacetOptions(tactics, 'audience', EMPTY_FILTERS, audienceNames)
    expect(options[0]).toMatchObject({ label: 'Homeowners 35-54', count: 2, budget: 30000 })
  })
})

describe('filter state helpers', () => {
  it('counts every selected value across dimensions', () => {
    expect(countActiveFilters(EMPTY_FILTERS)).toBe(0)
    expect(countActiveFilters(withFilters({ channel: ['a', 'b'], audience: [AUD_A] }))).toBe(3)
  })

  it('validates dimension names coming from the URL', () => {
    expect(isPivotDimension('channel')).toBe(true)
    expect(isPivotDimension('funnel_stage')).toBe(true)
    expect(isPivotDimension('nonsense')).toBe(false)
    expect(isPivotDimension(null)).toBe(false)
  })
})

describe('normalizeTactics', () => {
  it('blanks an audience_id with no matching audience row', () => {
    expect(normalized.find((t) => t.id === 't5')?.audience_id).toBeNull()
  })

  it('leaves live audience ids untouched', () => {
    expect(normalized.find((t) => t.id === 't1')?.audience_id).toBe(AUD_A)
    expect(normalized.find((t) => t.id === 't4')?.audience_id).toBeNull()
  })

  it('is a no-op while the audience list is still loading', () => {
    const pending = normalizeTactics(tactics, null)
    expect(pending).toBe(tactics)
    expect(pending.find((t) => t.id === 't5')?.audience_id).toBe(AUD_GONE)
  })

  it('makes a dangling audience filterable as Unassigned', () => {
    const result = applyFilters(normalized, withFilters({ audience: [UNASSIGNED] }))
    expect(result.map((t) => t.id)).toEqual(['t4', 't5'])
  })
})
