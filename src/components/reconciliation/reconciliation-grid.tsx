'use client'

import { InlineCell } from '@/components/tactics/inline-cell'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { formatMonthLabel } from '@/lib/budget/monthly-allocation'
import type { ReconciliationGrid as Grid, MonthCell } from '@/lib/reconciliation/compute'

interface ReconciliationGridProps {
  grid: Grid
  onSaveActual: (platform: string, monthKey: string, value: number) => Promise<void>
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n)
}

export function ReconciliationGrid({ grid, onSaveActual }: ReconciliationGridProps) {
  if (grid.platforms.length === 0) {
    return (
      <div className="flex items-center justify-center py-20 text-center">
        <p className="text-sm text-muted-foreground max-w-sm">
          No tactics with a platform, budget, and flight dates yet across this advertiser&rsquo;s
          active campaigns — add tactics to see reconciliation here.
        </p>
      </div>
    )
  }

  const maxCellValue = Math.max(
    1,
    ...grid.platforms.flatMap((p) => p.months.map((m) => m.actual ?? m.needed ?? m.planned ?? 0))
  )

  return (
    <TooltipProvider>
      <div className="overflow-auto rounded-md border border-border">
        <table className="min-w-full border-collapse text-sm">
          <thead className="bg-muted sticky top-0 z-10">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground min-w-[140px]">
                Platform
              </th>
              {grid.months.map((m) => (
                <th key={m.key} className="px-2 py-2 text-left font-medium text-muted-foreground min-w-[120px]">
                  {formatMonthLabel(m.key)}
                </th>
              ))}
              <th className="px-3 py-2 text-right font-medium text-muted-foreground min-w-[110px]">
                Total Planned
              </th>
              <th className="px-3 py-2 text-right font-medium text-muted-foreground min-w-[110px]">
                Remaining
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {grid.platforms.map((row) => (
              <tr key={row.platform} className="hover:bg-muted/30">
                <td className="px-3 py-2 font-medium text-foreground align-top">{row.platform}</td>
                {row.months.map((cell) => (
                  <td key={cell.monthKey} className="px-1.5 py-1.5 align-top">
                    <ReconciliationCellView
                      cell={cell}
                      maxValue={maxCellValue}
                      onSave={(v) => onSaveActual(row.platform, cell.monthKey, v)}
                    />
                  </td>
                ))}
                <td className="px-3 py-2 text-right text-muted-foreground align-top">
                  {formatCurrency(row.totalPlanned)}
                </td>
                <td className="px-3 py-2 text-right font-medium text-foreground align-top">
                  {formatCurrency(row.remainingBudget)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </TooltipProvider>
  )
}

interface ReconciliationCellViewProps {
  cell: MonthCell
  maxValue: number
  onSave: (value: number) => Promise<void>
}

function ReconciliationCellView({ cell, maxValue, onSave }: ReconciliationCellViewProps) {
  const barValue = cell.actual ?? cell.needed ?? cell.planned
  const barHeightPct = Math.min(100, Math.round((barValue / maxValue) * 100))
  const variance = cell.actual != null ? cell.actual - cell.planned : null

  if (cell.isEditable) {
    return (
      <div className="relative h-16 rounded overflow-hidden bg-muted/50">
        <div
          className={cn(
            'absolute inset-x-0 bottom-0 transition-all',
            cell.actual != null ? 'bg-brand-teal/25' : 'bg-brand-dusk/15'
          )}
          style={{ height: `${barHeightPct}%` }}
        />
        <div className="relative z-10 flex h-full flex-col justify-between p-1">
          <InlineCell
            value={cell.actual}
            variant="number"
            placeholder="Enter actual"
            className="bg-transparent text-xs font-medium"
            displayFormat={(v) => (v == null || v === '' ? null : formatCurrency(Number(v)))}
            onSave={async (v) => {
              const num = v === '' ? 0 : parseFloat(v)
              if (!isNaN(num)) await onSave(num)
            }}
          />
          {variance != null && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span
                  className={cn(
                    'text-[11px] px-1 self-start rounded cursor-help',
                    variance === 0 && 'text-muted-foreground',
                    variance > 0 && 'text-brand-rust',
                    variance < 0 && 'text-brand-teal'
                  )}
                >
                  {variance > 0 ? '+' : ''}
                  {formatCurrency(variance)} vs plan
                </span>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                Planned {formatCurrency(cell.planned)}
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    )
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="relative h-16 rounded overflow-hidden bg-muted/30 border border-dashed border-brand-gold/40 cursor-help">
          <div
            className="absolute inset-x-0 bottom-0 bg-brand-gold/20 transition-all"
            style={{ height: `${barHeightPct}%` }}
          />
          <div className="relative z-10 flex h-full items-center justify-center p-1">
            <span className="text-xs italic text-muted-foreground">
              {cell.needed != null ? formatCurrency(cell.needed) : '—'}
            </span>
          </div>
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs">
        Calculated needed spend to stay on plan (planned: {formatCurrency(cell.planned)})
      </TooltipContent>
    </Tooltip>
  )
}
