'use client'

import { useCampaign } from '@/hooks/use-campaign'
import { useTactics } from '@/hooks/use-tactics'
import { WorkspaceHeader } from '@/components/layout/workspace-header'
import { WorkspaceTabs } from '@/components/layout/workspace-tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { TacticsGrid } from '@/components/tactics/tactics-grid'
import type { CampaignStatus } from '@/lib/constants'

interface CampaignWorkspaceProps {
  campaignId: string
}

export function CampaignWorkspace({ campaignId }: CampaignWorkspaceProps) {
  const { campaign, isLoading: campaignLoading, error: campaignError, mutate } = useCampaign(campaignId)
  const { tactics } = useTactics(campaignId)

  const allocatedBudget = tactics.reduce(
    (sum: number, t: { budget?: number }) => sum + (t.budget ?? 0),
    0
  )

  if (campaignLoading) {
    return (
      <div className="flex flex-col h-full">
        <div className="bg-white border-b border-gray-200 px-6 py-4 space-y-2">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="p-6">
          <Skeleton className="h-8 w-64 mb-4" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    )
  }

  if (campaignError || !campaign) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-gray-500">Campaign not found.</p>
      </div>
    )
  }

  function handleStatusChange(status: CampaignStatus) {
    mutate({ ...campaign, status }, false)
  }

  const tacticsContent = (
    <TacticsGrid
      campaignId={campaignId}
      campaignBudget={campaign.budget ?? 0}
    />
  )

  return (
    <div className="flex flex-col h-full">
      <WorkspaceHeader
        campaign={campaign}
        allocatedBudget={allocatedBudget}
        onStatusChange={handleStatusChange}
      />
      <div className="flex-1 overflow-hidden">
        <WorkspaceTabs tacticsContent={tacticsContent} />
      </div>
    </div>
  )
}
