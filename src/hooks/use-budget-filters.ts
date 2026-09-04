'use client'

import { useCallback, useMemo } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import {
  DEFAULT_GROUP_BY,
  EMPTY_FILTERS,
  PIVOT_DIMENSIONS,
  dimensionParam,
  isPivotDimension,
  type BudgetFilters,
  type PivotDimension,
} from '@/lib/budget/filters'

const GROUP_BY_PARAM = 'groupBy'

/**
 * Budget Summary filter + pivot state, held in the URL query string.
 *
 * The URL (rather than useState) is the store for two reasons: a filtered
 * view is shareable and survives a reload, and WorkspaceTabs uses Radix Tabs,
 * which unmounts inactive tab content — component state would silently reset
 * every time the user visits another tab and comes back.
 *
 * Values are written as repeated params (?channel=A&channel=B) rather than a
 * comma-joined list because platform and channel are free text and may
 * themselves contain commas.
 *
 * Consumers must sit inside a <Suspense> boundary: useSearchParams triggers
 * client-side rendering up to the nearest boundary, and a production build
 * fails without one.
 */
export function useBudgetFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const filters = useMemo<BudgetFilters>(() => {
    const next = { ...EMPTY_FILTERS }
    for (const { value, param } of PIVOT_DIMENSIONS) {
      next[value] = searchParams.getAll(param).filter((v) => v !== '')
    }
    return next
  }, [searchParams])

  const groupBy: PivotDimension = useMemo(() => {
    const raw = searchParams.get(GROUP_BY_PARAM)
    return isPivotDimension(raw) ? raw : DEFAULT_GROUP_BY
  }, [searchParams])

  // `replace` rather than `push`: toggling filter checkboxes shouldn't bury
  // the campaign page under a stack of history entries. scroll: false keeps
  // the workspace from jumping back to the top on every toggle.
  const commit = useCallback(
    (params: URLSearchParams) => {
      const query = params.toString()
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
    },
    [pathname, router]
  )

  const setDimensionFilter = useCallback(
    (dimension: PivotDimension, values: string[]) => {
      const params = new URLSearchParams(searchParams.toString())
      const param = dimensionParam(dimension)
      params.delete(param)
      for (const value of values) params.append(param, value)
      commit(params)
    },
    [commit, searchParams]
  )

  const toggleDimensionValue = useCallback(
    (dimension: PivotDimension, value: string) => {
      const current = searchParams.getAll(dimensionParam(dimension)).filter((v) => v !== '')
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value]
      setDimensionFilter(dimension, next)
    },
    [searchParams, setDimensionFilter]
  )

  const clearDimension = useCallback(
    (dimension: PivotDimension) => setDimensionFilter(dimension, []),
    [setDimensionFilter]
  )

  const clearAll = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString())
    for (const { param } of PIVOT_DIMENSIONS) params.delete(param)
    commit(params)
  }, [commit, searchParams])

  const setGroupBy = useCallback(
    (dimension: PivotDimension) => {
      const params = new URLSearchParams(searchParams.toString())
      // The default doesn't need to sit in the URL — keeps a plain link clean.
      if (dimension === DEFAULT_GROUP_BY) params.delete(GROUP_BY_PARAM)
      else params.set(GROUP_BY_PARAM, dimension)
      commit(params)
    },
    [commit, searchParams]
  )

  return {
    filters,
    groupBy,
    setDimensionFilter,
    toggleDimensionValue,
    clearDimension,
    clearAll,
    setGroupBy,
  }
}
