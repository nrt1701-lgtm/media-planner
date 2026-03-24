'use client'

import { useChannels } from '@/hooks/use-channels'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BudgetByChannelChart } from './budget-by-channel-chart'
import { SpendTimelineChart } from './spend-timeline-chart'
import { PlatformPieChart } from './platform-pie-chart'
import { BudgetTable } from './budget-table'

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
  budget?: number | null
  start_date?: string | null
  end_date?: string | null
}

interface BudgetSummaryProps {
  campaignId: string
  tactics: Tactic[]
  campaign: Campaign
}

export function BudgetSummary({ tactics, campaign }: BudgetSummaryProps) {
  const { channels } = useChannels()

  const campaignBudget = campaign?.budget ?? 0

  return (
    <div className="p-6 space-y-6">
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
            <BudgetByChannelChart tactics={tactics} channels={channels} />
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
            <PlatformPieChart tactics={tactics} />
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
            <SpendTimelineChart tactics={tactics} campaign={campaign} />
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
          <BudgetTable tactics={tactics} campaignBudget={campaignBudget} />
        </CardContent>
      </Card>
    </div>
  )
}
