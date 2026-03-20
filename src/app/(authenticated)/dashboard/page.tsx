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
        <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
        <p className="text-sm text-gray-500 mt-1">
          Here&apos;s a look at your recent campaigns.
        </p>
      </div>

      <section>
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
          Recent Campaigns
        </h2>

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-14 w-full rounded-lg" />
            ))}
          </div>
        ) : recentCampaigns.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 bg-white px-6 py-10 text-center">
            <p className="text-sm text-gray-500">
              No campaigns yet. Select a client in the sidebar to get started.
            </p>
          </div>
        ) : (
          <div className="rounded-lg border border-gray-200 bg-white overflow-hidden divide-y divide-gray-100">
            {recentCampaigns.map((campaign) => (
              <Link
                key={campaign.id}
                href={`/campaigns/${campaign.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{campaign.name}</p>
                  {campaign.start_date && campaign.end_date && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      {formatDate(campaign.start_date)} – {formatDate(campaign.end_date)}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                  <span className="text-sm text-gray-600">{formatCurrency(campaign.total_budget)}</span>
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
