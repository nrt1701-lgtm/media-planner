'use client'

interface BudgetFooterProps {
  allocated: number
  total: number
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}

export function BudgetFooter({ allocated, total }: BudgetFooterProps) {
  const hasBudget = total > 0
  const remaining = total - allocated
  const isOver = hasBudget && remaining < 0

  return (
    <div className="flex items-center gap-6 px-4 py-3 bg-muted border-t border-border text-sm">
      <div className="flex items-center gap-1.5">
        <span className="text-muted-foreground">Total Allocated:</span>
        <span className="font-medium text-foreground">{formatCurrency(allocated)}</span>
      </div>
      <div className="text-muted-foreground">|</div>
      <div className="flex items-center gap-1.5">
        <span className="text-muted-foreground">Campaign Budget:</span>
        <span className="font-medium text-foreground">{hasBudget ? formatCurrency(total) : <span className="text-muted-foreground">Not set</span>}</span>
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
    </div>
  )
}
