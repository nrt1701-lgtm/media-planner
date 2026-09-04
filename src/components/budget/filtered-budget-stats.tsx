'use client'

import { FilterIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface FilteredBudgetStatsProps {
  filteredBudget: number
  campaignBudget: number
  tacticCount: number
  totalTacticCount: number
  isFiltered: boolean
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n)
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="flex-1 min-w-[140px] px-4 py-3">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-xl font-semibold text-foreground tabular-nums">{value}</p>
      {hint && <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>}
    </div>
  )
}

export function FilteredBudgetStats({
  filteredBudget,
  campaignBudget,
  tacticCount,
  totalTacticCount,
  isFiltered,
}: FilteredBudgetStatsProps) {
  // Share is always measured against the full campaign budget, so a filtered
  // view reads as "this slice is 40% of the campaign" rather than silently
  // renormalizing to 100%.
  const share = campaignBudget > 0 ? (filteredBudget / campaignBudget) * 100 : null

  return (
    <div className="flex flex-wrap items-stretch divide-x divide-border rounded-lg border border-border bg-card">
      <Stat
        label={isFiltered ? 'Filtered Spend' : 'Allocated Spend'}
        value={formatCurrency(filteredBudget)}
        hint={
          isFiltered
            ? `${tacticCount} of ${totalTacticCount} tactic${totalTacticCount === 1 ? '' : 's'}`
            : `${totalTacticCount} tactic${totalTacticCount === 1 ? '' : 's'}`
        }
      />
      <Stat label="Campaign Budget" value={formatCurrency(campaignBudget)} />
      <Stat
        label="% of Campaign"
        value={share == null ? '—' : `${share.toFixed(1)}%`}
        hint={share == null ? 'Set a campaign budget' : undefined}
      />
      {isFiltered && (
        <div className="flex items-center px-4 py-3">
          <Badge className="gap-1 bg-brand-teal/15 text-brand-teal border-transparent hover:bg-brand-teal/15">
            <FilterIcon className="size-3" />
            Filtered view
          </Badge>
        </div>
      )}
    </div>
  )
}
