'use client'

import { useMemo, useState } from 'react'
import { useChannels } from '@/hooks/use-channels'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BudgetByChannelChart } from './budget-by-channel-chart'
import { SpendTimelineChart } from './spend-timeline-chart'
import { PlatformPieChart } from './platform-pie-chart'
import { BudgetTable } from './budget-table'
import { CostViewToggle, type CostView } from './cost-view-toggle'
import { toGross, toNet } from '@/lib/budget/markup'

interface Tactic {
  id: string
  name?: string | null
  channel?: string | null
  platform?: string | null
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

export function BudgetSummary({ tactics, campaign, markupPercentage = 0 }: BudgetSummaryProps) {
  const { channels } = useChannels()
  const [costView, setCostView] = useState<CostView>('net')

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

  const totalBudget = campaign?.total_budget ?? 0
  const campaignBudget = costView === 'gross' ? totalBudget : toNet(totalBudget, markupPercentage)

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-end">
        <CostViewToggle value={costView} onChange={setCostView} />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Budget by Channel */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-foreground">
              Budget by Channel
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <BudgetByChannelChart tactics={displayTactics} channels={channels} />
          </CardContent>
        </Card>

        {/* Platform Breakdown */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-foreground">
              Budget by Platform
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <PlatformPieChart tactics={displayTactics} />
          </CardContent>
        </Card>

        {/* Spend Timeline */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-foreground">
              Spend Timeline
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <SpendTimelineChart tactics={displayTactics} campaign={campaign} />
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
          <BudgetTable tactics={displayTactics} campaignBudget={campaignBudget} />
        </CardContent>
      </Card>
    </div>
  )
}
