'use client'

import { CostViewToggle, type CostView } from '@/components/budget/cost-view-toggle'
import { toGross, toNet } from '@/lib/budget/markup'

interface BudgetFooterProps {
  allocated: number
  total: number
  markupPercentage?: number
  costView: CostView
  onCostViewChange: (view: CostView) => void
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}

export function BudgetFooter({
  allocated,
  total,
  markupPercentage = 0,
  costView,
  onCostViewChange,
}: BudgetFooterProps) {
  // `total` (the campaign's approved budget) is always gross; `allocated` is
  // the raw sum of tactic (net) budgets. Convert both to the selected basis.
  const displayAllocated = costView === 'gross' ? toGross(allocated, markupPercentage) : allocated
  const displayTotal = costView === 'gross' ? total : toNet(total, markupPercentage)

  const hasBudget = displayTotal > 0
  const remaining = displayTotal - displayAllocated
  const isOver = hasBudget && remaining < 0

  return (
    <div className="flex items-center gap-6 px-4 py-3 bg-muted border-t border-border text-sm">
      <div className="flex items-center gap-1.5">
        <span className="text-muted-foreground">Total Allocated:</span>
        <span className="font-medium text-foreground">{formatCurrency(displayAllocated)}</span>
      </div>
      <div className="text-muted-foreground">|</div>
      <div className="flex items-center gap-1.5">
        <span className="text-muted-foreground">Campaign Budget:</span>
        <span className="font-medium text-foreground">{hasBudget ? formatCurrency(displayTotal) : <span className="text-muted-foreground">Not set</span>}</span>
      </div>
      <div className="text-muted-foreground">|</div>
      <div className="flex items-center gap-1.5">
        <span className="text-muted-foreground">Remaining:</span>
        <span className={`font-semibold ${isOver ? 'text-amber-600' : hasBudget ? 'text-green-600' : 'text-muted-foreground'}`}>
          {hasBudget ? formatCurrency(remaining) : '—'}
        </span>
        {isOver && (
          <span className="text-xs text-amber-600 font-medium">(over budget)</span>
        )}
      </div>
      <div className="ml-auto">
        <CostViewToggle value={costView} onChange={onCostViewChange} />
      </div>
    </div>
  )
}
