'use client'

import { Suspense, useMemo, useState } from 'react'
import { FilterXIcon } from 'lucide-react'
import { useChannels } from '@/hooks/use-channels'
import { useAudiences } from '@/hooks/use-audiences'
import { useBudgetFilters } from '@/hooks/use-budget-filters'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { BudgetByDimensionChart } from './budget-by-dimension-chart'
import { DimensionMixChart } from './dimension-mix-chart'
import { SpendTimelineChart } from './spend-timeline-chart'
import { BudgetTable } from './budget-table'
import { BudgetFilterBar } from './budget-filter-bar'
import { GroupBySelect } from './group-by-select'
import { FilteredBudgetStats } from './filtered-budget-stats'
import { CostViewToggle, type CostView } from './cost-view-toggle'
import { toGross, toNet } from '@/lib/budget/markup'
import { buildDimensionColorMap } from '@/lib/budget/dimension-colors'
import {
  applyFilters,
  dimensionLabel,
  groupByDimension,
  hasAnyFilter,
  normalizeTactics,
  totalBudget,
} from '@/lib/budget/filters'

interface Tactic {
  id: string
  name?: string | null
  channel?: string | null
  platform?: string | null
  funnel_stage?: string | null
  audience_id?: string | null
  budget?: number | null
  rate_type?: string | null
  rate?: number | null
  est_impressions?: number | null
  flight_start?: string | null
  flight_end?: string | null
}

interface Campaign {
  total_budget?: number | null
  start_date?: string | null
  end_date?: string | null
}

interface BudgetSummaryProps {
  campaignId: string
  tactics: Tactic[]
  campaign: Campaign
  markupPercentage?: number
}

// useBudgetFilters reads the URL query string, which bails out of prerendering
// up to the nearest Suspense boundary; a production build fails without one.
export function BudgetSummary(props: BudgetSummaryProps) {
  return (
    <Suspense fallback={<BudgetSummaryFallback />}>
      <BudgetSummaryContent {...props} />
    </Suspense>
  )
}

function BudgetSummaryFallback() {
  return (
    <div className="p-6 space-y-6">
      <Skeleton className="h-8 w-full max-w-lg" />
      <Skeleton className="h-20 w-full" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  )
}

function BudgetSummaryContent({
  campaignId,
  tactics,
  campaign,
  markupPercentage = 0,
}: BudgetSummaryProps) {
  const { channels } = useChannels()
  const { audiences, isLoading: audiencesLoading } = useAudiences(campaignId)
  const [costView, setCostView] = useState<CostView>('net')
  const {
    filters,
    groupBy,
    toggleDimensionValue,
    clearDimension,
    clearAll,
    setGroupBy,
  } = useBudgetFilters()

  const audienceNameById = useMemo(
    () => new Map(audiences.map((audience) => [audience.id, audience.name])),
    [audiences]
  )

  // total_budget is always the client-approved (gross) figure; tactic.budget
  // is net media cost. Map everything to the selected basis once here so the
  // charts/table below (which just read `.budget`) don't need markup logic.
  const displayTactics = useMemo(
    () =>
      costView === 'gross'
        ? tactics.map((t) => ({ ...t, budget: t.budget != null ? toGross(t.budget, markupPercentage) : t.budget }))
        : tactics,
    [tactics, costView, markupPercentage]
  )

  // Collapse audience_ids that no longer resolve before anything groups or
  // filters on them. Passing null while the audience list is in flight keeps
  // every audience from momentarily reading as Unassigned.
  const normalizedTactics = useMemo(
    () =>
      normalizeTactics(
        displayTactics,
        audiencesLoading ? null : new Set(audiences.map((a) => a.id))
      ),
    [displayTactics, audiences, audiencesLoading]
  )

  const filteredTactics = useMemo(
    () => applyFilters(normalizedTactics, filters),
    [normalizedTactics, filters]
  )

  const groups = useMemo(
    () => groupByDimension(filteredTactics, groupBy, audienceNameById),
    [filteredTactics, groupBy, audienceNameById]
  )

  // Built once and shared by both charts, so a group is the same color in the
  // bar chart and the mix donut.
  const colorMap = useMemo(
    () => buildDimensionColorMap(groups, groupBy, channels),
    [groups, groupBy, channels]
  )

  const isFiltered = hasAnyFilter(filters)
  const filteredBudget = totalBudget(filteredTactics)
  const campaignTotal = campaign?.total_budget ?? 0
  const campaignBudget = costView === 'gross' ? campaignTotal : toNet(campaignTotal, markupPercentage)
  const groupLabel = dimensionLabel(groupBy)
  const hasNoMatches = isFiltered && filteredTactics.length === 0

  return (
    <div className="p-6 space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <BudgetFilterBar
          tactics={normalizedTactics}
          filters={filters}
          audienceNameById={audienceNameById}
          audiencesLoading={audiencesLoading}
          onToggle={toggleDimensionValue}
          onClearDimension={clearDimension}
          onClearAll={clearAll}
        />
        <div className="flex items-center gap-3">
          <GroupBySelect value={groupBy} onChange={setGroupBy} />
          <CostViewToggle value={costView} onChange={setCostView} />
        </div>
      </div>

      <FilteredBudgetStats
        filteredBudget={filteredBudget}
        campaignBudget={campaignBudget}
        tacticCount={filteredTactics.length}
        totalTacticCount={normalizedTactics.length}
        isFiltered={isFiltered}
      />

      {hasNoMatches ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border py-16">
          <FilterXIcon className="size-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No tactics match the current filters.</p>
          <Button variant="outline" size="sm" onClick={clearAll}>
            Clear filters
          </Button>
        </div>
      ) : (
        <>
          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-foreground">
                  Budget by {groupLabel}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <BudgetByDimensionChart
                  groups={groups}
                  colorMap={colorMap}
                  emptyMessage={`No ${groupLabel.toLowerCase()} data yet`}
                />
              </CardContent>
            </Card>

            <Card className="lg:col-span-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-foreground">
                  {groupLabel} Mix
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <DimensionMixChart
                  groups={groups}
                  colorMap={colorMap}
                  emptyMessage={`No ${groupLabel.toLowerCase()} data yet`}
                />
              </CardContent>
            </Card>

            <Card className="lg:col-span-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-foreground">
                  Spend Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <SpendTimelineChart tactics={filteredTactics} campaign={campaign} />
              </CardContent>
            </Card>
          </div>

          {/* Full-width table */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-foreground">
                Tactic Budget Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 px-0">
              <BudgetTable
                tactics={filteredTactics}
                campaignBudget={campaignBudget}
                isFiltered={isFiltered}
              />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
