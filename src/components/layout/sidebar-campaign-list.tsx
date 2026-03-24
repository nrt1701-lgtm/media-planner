'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Plus, MoreHorizontal, Pencil } from 'lucide-react'
import { useCampaigns } from '@/hooks/use-campaigns'
import { StatusBadge } from '@/components/campaigns/status-badge'
import { CreateCampaignDialog } from '@/components/campaigns/create-campaign-dialog'
import { EditCampaignDialog } from '@/components/campaigns/edit-campaign-dialog'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { CampaignStatus } from '@/lib/constants'

interface Client {
  id: string
  name: string
  client_code: string
}

interface Campaign {
  id: string
  name: string
  status: CampaignStatus
  total_budget: number
  start_date: string
  end_date: string
  default_landing_page?: string | null
}

interface SidebarCampaignListProps {
  client: Client
}

export function SidebarCampaignList({ client }: SidebarCampaignListProps) {
  const { campaigns, isLoading, mutate } = useCampaigns(client.id)
  const pathname = usePathname()
  const router = useRouter()
  const [createOpen, setCreateOpen] = useState(false)
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null)

  return (
    <div className="mt-1 mb-1">
      {isLoading ? (
        <div className="px-4 py-1 space-y-1.5">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-7 w-full rounded" />
          ))}
        </div>
      ) : campaigns.length === 0 ? (
        <div className="px-4 py-2">
          <p className="text-xs text-muted-foreground italic">No campaigns for this client.</p>
        </div>
      ) : (
        <ul className="space-y-0.5 px-2">
          {campaigns.map((campaign: Campaign) => {
            const isActive = pathname === `/campaigns/${campaign.id}`
            return (
              <li key={campaign.id} className="group flex items-center gap-1">
                <Link
                  href={`/campaigns/${campaign.id}`}
                  className={`flex items-center justify-between gap-2 flex-1 min-w-0 px-3 py-1.5 rounded-md text-xs transition-colors ${
                    isActive
                      ? 'bg-brand-teal/10 text-brand-teal font-medium'
                      : 'text-muted-foreground hover:text-foreground hover:bg-sidebar-accent'
                  }`}
                >
                  <span className="truncate">{campaign.name}</span>
                  <StatusBadge status={campaign.status} />
                </Link>

                {/* Three-dot menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 focus-within:opacity-100 flex-shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreHorizontal className="w-3 h-3" />
                      <span className="sr-only">Campaign options</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-36">
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation()
                        setEditingCampaign(campaign)
                      }}
                    >
                      <Pencil className="w-3.5 h-3.5 mr-2" />
                      Edit
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </li>
            )
          })}
        </ul>
      )}

      <div className="px-3 pt-1">
        <Button
          variant="ghost"
          size="sm"
          className="w-full h-7 text-xs text-muted-foreground hover:text-brand-teal justify-start gap-1.5 px-2"
          onClick={() => setCreateOpen(true)}
        >
          <Plus className="w-3 h-3" />
          New Campaign
        </Button>
      </div>

      <CreateCampaignDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={mutate}
        clientId={client.id}
        clientCode={client.client_code}
      />

      {editingCampaign && (
        <EditCampaignDialog
          open={!!editingCampaign}
          onOpenChange={(open) => { if (!open) setEditingCampaign(null) }}
          campaign={editingCampaign}
          onSuccess={mutate}
          onDeleted={() => {
            mutate()
            // Navigate away if we were viewing the deleted campaign
            if (pathname === `/campaigns/${editingCampaign.id}`) {
              router.push('/dashboard')
            }
          }}
        />
      )}
    </div>
  )
}
