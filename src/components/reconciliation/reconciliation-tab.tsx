'use client'

import { useMemo } from 'react'
import { useReconciliation } from '@/hooks/use-reconciliation'
import { usePlatformActuals } from '@/hooks/use-platform-actuals'
import { buildReconciliationGrid } from '@/lib/reconciliation/compute'
import { ReconciliationGrid } from './reconciliation-grid'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

interface ReconciliationTabProps {
  clientId: string
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n)
}

export function ReconciliationTab({ clientId }: ReconciliationTabProps) {
  const { campaigns, tactics, isLoading: reconLoading } = useReconciliation(clientId)
  const { actuals, isLoading: actualsLoading, saveActual } = usePlatformActuals(clientId)

  const grid = useMemo(() => buildReconciliationGrid(tactics, actuals), [tactics, actuals])

  async function handleSaveActual(platform: string, monthKey: string, value: number) {
    await saveActual(platform, `${monthKey}-01`, value)
  }

  if (reconLoading || actualsLoading) {
    return (
      <div className="p-6 space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full rounded" />
        ))}
      </div>
    )
  }

  const totalPlanned = grid.platforms.reduce((sum, p) => sum + p.totalPlanned, 0)
  const totalActual = grid.platforms.reduce((sum, p) => sum + p.actualToDate, 0)
  const totalRemaining = grid.platforms.reduce((sum, p) => sum + p.remainingBudget, 0)

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Total Planned</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-2xl font-semibold text-foreground">
            {formatCurrency(totalPlanned)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Actual to Date</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-2xl font-semibold text-foreground">
            {formatCurrency(totalActual)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Remaining Needed</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-2xl font-semibold text-foreground">
            {formatCurrency(totalRemaining)}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-foreground">Monthly Pacing by Platform</CardTitle>
        </CardHeader>
        <CardContent className="pt-0 px-0">
          <ReconciliationGrid grid={grid} onSaveActual={handleSaveActual} />
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Includes budget across {campaigns.length} active/planning/approved campaign
        {campaigns.length !== 1 ? 's' : ''} for this advertiser. Enter the actual invoiced amount for a
        past month to recalculate the needed spend for the months remaining.
      </p>
    </div>
  )
}
