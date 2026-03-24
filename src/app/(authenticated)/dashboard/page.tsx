'use client'

import Link from 'next/link'
import { useCampaigns } from '@/hooks/use-campaigns'
import { StatusBadge } from '@/components/campaigns/status-badge'
import { Skeleton } from '@/components/ui/skeleton'
import type { CampaignStatus } from '@/lib/constants'

interface Campaign {
  id: string
  name: string
  status: CampaignStatus
  total_budget: number
  start_date: string
  end_date: string
  client_id: string
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}

export default function DashboardPage() {
  const { campaigns, isLoading } = useCampaigns()

  const recentCampaigns = (campaigns as Campaign[]).slice(0, 10)

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Welcome back</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Here&apos;s a look at your recent campaigns.
        </p>
      </div>

      <section>
        <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-3">
          Recent Campaigns
        </h2>

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-14 w-full rounded-lg" />
            ))}
          </div>
        ) : recentCampaigns.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-card px-6 py-10 text-center">
            <p className="text-sm text-muted-foreground">
              No campaigns yet. Select a client in the sidebar to get started.
            </p>
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-card overflow-hidden divide-y divide-border">
            {recentCampaigns.map((campaign) => (
              <Link
                key={campaign.id}
                href={`/campaigns/${campaign.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-muted transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{campaign.name}</p>
                  {campaign.start_date && campaign.end_date && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatDate(campaign.start_date)} – {formatDate(campaign.end_date)}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                  <span className="text-sm text-muted-foreground">{formatCurrency(campaign.total_budget)}</span>
                  <StatusBadge status={campaign.status} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
