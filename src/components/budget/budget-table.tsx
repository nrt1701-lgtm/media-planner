'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { AlertTriangleIcon, AlertCircleIcon } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface Tactic {
  id: string
  name?: string | null
  channel?: string | null
  budget?: number | null
  rate_type?: string | null
  rate?: number | null
  est_impressions?: number | null
  flight_start?: string | null
  flight_end?: string | null
}

interface BudgetTableProps {
  tactics: Tactic[]
  campaignBudget: number
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n)
}

function formatNumber(n: number) {
  return new Intl.NumberFormat('en-US').format(n)
}

export function BudgetTable({ tactics, campaignBudget }: BudgetTableProps) {
  const totalAllocated = tactics.reduce((sum, t) => sum + (t.budget ?? 0), 0)
  const unallocated = campaignBudget - totalAllocated
  const isOverBudget = totalAllocated > campaignBudget && campaignBudget > 0

  return (
    <TooltipProvider>
      <div className="space-y-2">
        {/* Over-budget badge */}
        {isOverBudget && (
          <div className="flex items-center gap-2 px-1">
            <Badge className="bg-red-100 text-red-700 border-red-200 hover:bg-red-100 gap-1">
              <AlertCircleIcon className="size-3" />
              Over Budget by {formatCurrency(totalAllocated - campaignBudget)}
            </Badge>
          </div>
        )}

        {/* Unallocated budget warning */}
        {unallocated > 0 && campaignBudget > 0 && (
          <div className="flex items-center gap-2 px-1">
            <Badge className="bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-50 gap-1">
              <AlertTriangleIcon className="size-3" />
              {formatCurrency(unallocated)} unallocated
            </Badge>
          </div>
        )}

        <Table>
          <TableHeader>
            <TableRow className="bg-muted/80 hover:bg-muted/80">
              <TableHead className="min-w-[160px]">Tactic</TableHead>
              <TableHead className="min-w-[110px]">Channel</TableHead>
              <TableHead className="min-w-[100px] text-right">Budget</TableHead>
              <TableHead className="min-w-[100px]">Rate</TableHead>
              <TableHead className="min-w-[120px] text-right">Est. Impressions</TableHead>
              <TableHead className="min-w-[100px] text-right">% of Total</TableHead>
              <TableHead className="w-8" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {tactics.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8 text-sm">
                  No tactics yet
                </TableCell>
              </TableRow>
            ) : (
              tactics.map((tactic) => {
                const budget = tactic.budget ?? 0
                const pct = totalAllocated > 0 ? (budget / totalAllocated) * 100 : 0
                const hasBudget = budget > 0
                const missingChannel = hasBudget && !tactic.channel
                const missingDates =
                  hasBudget && (!tactic.flight_start || !tactic.flight_end)
                const hasWarning = missingChannel || missingDates

                const warningMessages: string[] = []
                if (missingChannel) warningMessages.push('No channel assigned')
                if (missingDates) warningMessages.push('Missing flight dates')

                return (
                  <TableRow key={tactic.id} className="hover:bg-muted/60">
                    <TableCell className="font-medium text-foreground">
                      {tactic.name || (
                        <span className="text-muted-foreground italic">Untitled</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {tactic.channel ?? (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {budget > 0 ? formatCurrency(budget) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {tactic.rate_type && tactic.rate != null ? (
                        `${formatCurrency(tactic.rate)} ${tactic.rate_type}`
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {tactic.est_impressions != null ? (
                        formatNumber(tactic.est_impressions)
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {budget > 0 ? `${pct.toFixed(1)}%` : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {hasWarning && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="inline-flex text-red-500 cursor-help">
                              <AlertTriangleIcon className="size-4" />
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="left" className="text-xs max-w-48">
                            <ul className="space-y-0.5">
                              {warningMessages.map((msg) => (
                                <li key={msg}>{msg}</li>
                              ))}
                            </ul>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>

        {/* Totals row */}
        {tactics.length > 0 && (
          <div className="flex items-center justify-between px-4 py-2.5 bg-muted border-t border-border text-sm">
            <span className="font-medium text-muted-foreground">
              {tactics.length} tactic{tactics.length !== 1 ? 's' : ''}
            </span>
            <div className="flex items-center gap-4">
              <span className="text-muted-foreground">Total Allocated:</span>
              <span className={`font-semibold ${isOverBudget ? 'text-red-600' : 'text-foreground'}`}>
                {formatCurrency(totalAllocated)}
              </span>
              {campaignBudget > 0 && (
                <>
                  <span className="text-border">|</span>
                  <span className="text-muted-foreground">Campaign Budget:</span>
                  <span className="font-medium text-foreground">{formatCurrency(campaignBudget)}</span>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}
