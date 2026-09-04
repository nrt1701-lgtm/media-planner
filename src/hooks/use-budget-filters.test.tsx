import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useBudgetFilters } from './use-budget-filters'
import { UNASSIGNED } from '@/lib/budget/filters'

// Stand-in for the App Router: `replace` writes back into the same search
// params the hook reads, so a round-trip through the URL is exercised for
// real rather than asserted on the call arguments alone.
let currentUrl = '/campaigns/abc'
const replace = vi.fn((url: string) => {
  currentUrl = url
})

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace }),
  usePathname: () => currentUrl.split('?')[0],
  useSearchParams: () => new URLSearchParams(currentUrl.split('?')[1] ?? ''),
}))

function setUrl(url: string) {
  currentUrl = url
}

// Re-render after each act() so the hook re-reads the mutated URL, the way a
// real navigation would push new search params down.
function renderFilters() {
  const view = renderHook(() => useBudgetFilters())
  return {
    get current() {
      return view.result.current
    },
    rerender: view.rerender,
  }
}

describe('useBudgetFilters', () => {
  beforeEach(() => {
    setUrl('/campaigns/abc')
    replace.mockClear()
  })

  it('defaults to no filters and grouping by channel', () => {
    const view = renderFilters()
    expect(view.current.filters).toEqual({
      channel: [],
      platform: [],
      funnel_stage: [],
      audience: [],
    })
    expect(view.current.groupBy).toBe('channel')
  })

  it('reads repeated params into a dimension selection', () => {
    setUrl('/campaigns/abc?channel=Paid+Social&channel=Paid+Search&funnel=Awareness')
    const view = renderFilters()
    expect(view.current.filters.channel).toEqual(['Paid Social', 'Paid Search'])
    expect(view.current.filters.funnel_stage).toEqual(['Awareness'])
  })

  it('round-trips a value containing a comma', () => {
    const view = renderFilters()
    act(() => view.current.toggleDimensionValue('platform', 'Hulu, Disney+'))
    view.rerender()
    expect(view.current.filters.platform).toEqual(['Hulu, Disney+'])
  })

  it('toggles a value on and back off', () => {
    const view = renderFilters()

    act(() => view.current.toggleDimensionValue('channel', 'Paid Social'))
    view.rerender()
    expect(view.current.filters.channel).toEqual(['Paid Social'])

    act(() => view.current.toggleDimensionValue('channel', 'Paid Social'))
    view.rerender()
    expect(view.current.filters.channel).toEqual([])
  })

  it('accumulates multiple values in one dimension', () => {
    const view = renderFilters()
    act(() => view.current.toggleDimensionValue('channel', 'Paid Social'))
    view.rerender()
    act(() => view.current.toggleDimensionValue('channel', 'Paid Search'))
    view.rerender()
    expect(view.current.filters.channel).toEqual(['Paid Social', 'Paid Search'])
  })

  it('keeps dimensions independent', () => {
    const view = renderFilters()
    act(() => view.current.toggleDimensionValue('channel', 'Paid Social'))
    view.rerender()
    act(() => view.current.toggleDimensionValue('audience', UNASSIGNED))
    view.rerender()

    expect(view.current.filters.channel).toEqual(['Paid Social'])
    expect(view.current.filters.audience).toEqual([UNASSIGNED])

    act(() => view.current.clearDimension('channel'))
    view.rerender()
    expect(view.current.filters.channel).toEqual([])
    expect(view.current.filters.audience).toEqual([UNASSIGNED])
  })

  it('clears every dimension but preserves unrelated params', () => {
    setUrl('/campaigns/abc?channel=Paid+Social&funnel=Awareness&groupBy=platform')
    const view = renderFilters()

    act(() => view.current.clearAll())
    view.rerender()

    expect(view.current.filters.channel).toEqual([])
    expect(view.current.filters.funnel_stage).toEqual([])
    // groupBy is a view setting, not a filter — "Clear all" must not reset it.
    expect(view.current.groupBy).toBe('platform')
  })

  it('stores groupBy but omits the default from the URL', () => {
    const view = renderFilters()

    act(() => view.current.setGroupBy('funnel_stage'))
    view.rerender()
    expect(view.current.groupBy).toBe('funnel_stage')
    expect(currentUrl).toContain('groupBy=funnel_stage')

    act(() => view.current.setGroupBy('channel'))
    view.rerender()
    expect(view.current.groupBy).toBe('channel')
    expect(currentUrl).not.toContain('groupBy')
  })

  it('falls back to the default for an unrecognized groupBy param', () => {
    setUrl('/campaigns/abc?groupBy=nonsense')
    expect(renderFilters().current.groupBy).toBe('channel')
  })

  it('uses replace, not push, so filter toggles do not stack history entries', () => {
    const view = renderFilters()
    act(() => view.current.toggleDimensionValue('channel', 'Paid Social'))
    expect(replace).toHaveBeenCalledWith(expect.stringContaining('channel=Paid+Social'), {
      scroll: false,
    })
  })

  it('drops the question mark when the last param is removed', () => {
    const view = renderFilters()
    act(() => view.current.toggleDimensionValue('channel', 'Paid Social'))
    view.rerender()
    act(() => view.current.clearAll())
    expect(currentUrl).toBe('/campaigns/abc')
  })
})
