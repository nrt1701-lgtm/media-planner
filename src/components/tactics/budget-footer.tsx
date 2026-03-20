'use client'

interface BudgetFooterProps {
  allocated: number
  total: number
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}

export function BudgetFooter({ allocated, total }: BudgetFooterProps) {
  const remaining = total - allocated
  const isOver = remaining < 0

  return (
    <div className="flex items-center gap-6 px-4 py-3 bg-gray-50 border-t border-gray-200 text-sm">
      <div className="flex items-center gap-1.5">
        <span className="text-gray-500">Total Allocated:</span>
        <span className="font-medium text-gray-900">{formatCurrency(allocated)}</span>
      </div>
      <div className="text-gray-300">|</div>
      <div className="flex items-center gap-1.5">
        <span className="text-gray-500">Campaign Budget:</span>
        <span className="font-medium text-gray-900">{formatCurrency(total)}</span>
      </div>
      <div className="text-gray-300">|</div>
      <div className="flex items-center gap-1.5">
        <span className="text-gray-500">Remaining:</span>
        <span className={`font-semibold ${isOver ? 'text-amber-600' : 'text-green-600'}`}>
          {formatCurrency(remaining)}
        </span>
        {isOver && (
          <span className="text-xs text-amber-600 font-medium">(over budget)</span>
        )}
      </div>
    </div>
  )
}
