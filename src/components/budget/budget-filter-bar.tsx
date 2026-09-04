'use client'

import { XIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FacetFilter } from './facet-filter'
import {
  PIVOT_DIMENSIONS,
  countActiveFilters,
  getDimensionLabel,
  getFacetOptions,
  type BudgetFilters,
  type FilterableTactic,
  type PivotDimension,
} from '@/lib/budget/filters'

interface BudgetFilterBarProps {
  tactics: FilterableTactic[]
  filters: BudgetFilters
  audienceNameById: Map<string, string>
  /** Audience keys are ids; until the names arrive every option would render
   *  as "Unassigned", so that one facet waits for them. */
  audiencesLoading?: boolean
  onToggle: (dimension: PivotDimension, key: string) => void
  onClearDimension: (dimension: PivotDimension) => void
  onClearAll: () => void
}

export function BudgetFilterBar({
  tactics,
  filters,
  audienceNameById,
  audiencesLoading = false,
  onToggle,
  onClearDimension,
  onClearAll,
}: BudgetFilterBarProps) {
  const activeCount = countActiveFilters(filters)

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        {PIVOT_DIMENSIONS.map((dimension) => (
          <FacetFilter
            key={dimension.value}
            label={dimension.label}
            options={getFacetOptions(tactics, dimension.value, filters, audienceNameById)}
            selected={filters[dimension.value]}
            onToggle={(key) => onToggle(dimension.value, key)}
            onClear={() => onClearDimension(dimension.value)}
            disabled={dimension.value === 'audience' && audiencesLoading}
          />
        ))}

        {activeCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearAll}
            className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            Clear all
            <XIcon className="size-3.5" />
          </Button>
        )}
      </div>

      {/* Active selections as removable chips — with four facets collapsed
          into trigger buttons, this is the only place the full active filter
          is legible at a glance. */}
      {activeCount > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {PIVOT_DIMENSIONS.map((dimension) =>
            filters[dimension.value].map((key) => (
              <Badge
                key={`${dimension.value}:${key}`}
                variant="secondary"
                className="gap-1 pl-2 pr-1 font-normal"
              >
                <span className="text-muted-foreground">{dimension.label}:</span>
                {getDimensionLabel(key, dimension.value, audienceNameById)}
                <button
                  type="button"
                  onClick={() => onToggle(dimension.value, key)}
                  aria-label={`Remove ${dimension.label} filter ${getDimensionLabel(key, dimension.value, audienceNameById)}`}
                  className="rounded-sm p-0.5 hover:bg-muted-foreground/20 transition-colors"
                >
                  <XIcon className="size-3" />
                </button>
              </Badge>
            ))
          )}
        </div>
      )}
    </div>
  )
}
