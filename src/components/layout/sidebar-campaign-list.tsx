'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Plus } from 'lucide-react'
import { useCampaigns } from '@/hooks/use-campaigns'
import { StatusBadge } from '@/components/campaigns/status-badge'
import { CreateCampaignDialog } from '@/components/campaigns/create-campaign-dialog'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { CampaignStatus } from '@/lib/constants'

interface Client {
  id: string
  name: string
  client_code: string
}

interface SidebarCampaignListProps {
  client: Client
}

export function SidebarCampaignList({ client }: SidebarCampaignListProps) {
  const { campaigns, isLoading, mutate } = useCampaigns(client.id)
  const pathname = usePathname()
  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <div className="mt-1 mb-1">
      {isLoading ? (
        <div className="px-4 py-1 space-y-1.5">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-7 w-full rounded" />
          ))}
        </div>
      ) : campaigns.length === 0 ? (
        <div className="px-4 py-2">
          <p className="text-xs text-gray-400 italic">No campaigns yet</p>
        </div>
      ) : (
        <ul className="space-y-0.5 px-2">
          {campaigns.map((campaign: { id: string; name: string; status: CampaignStatus }) => {
            const isActive = pathname === `/campaigns/${campaign.id}`
            return (
              <li key={campaign.id}>
                <Link
                  href={`/campaigns/${campaign.id}`}
                  className={`flex items-center justify-between gap-2 px-3 py-1.5 rounded-md text-xs transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <span className="truncate">{campaign.name}</span>
                  <StatusBadge status={campaign.status} />
                </Link>
              </li>
            )
          })}
        </ul>
      )}

      <div className="px-3 pt-1">
        <Button
          variant="ghost"
          size="sm"
          className="w-full h-7 text-xs text-gray-500 hover:text-blue-600 justify-start gap-1.5 px-2"
          onClick={() => setDialogOpen(true)}
        >
          <Plus className="w-3 h-3" />
          New Campaign
        </Button>
      </div>

      <CreateCampaignDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={mutate}
        clientId={client.id}
        clientCode={client.client_code}
      />
    </div>
  )
}
