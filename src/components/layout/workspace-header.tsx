'use client'

import { useState } from 'react'
import { ChevronRight, Calendar } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { StatusBadge } from '@/components/campaigns/status-badge'
import { CostViewToggle, type CostView } from '@/components/budget/cost-view-toggle'
import { toGross, toNet } from '@/lib/budget/markup'
import { CAMPAIGN_STATUSES, type CampaignStatus } from '@/lib/constants'

interface Campaign {
  id: string
  name: string
  status: CampaignStatus
  total_budget: number
  start_date: string
  end_date: string
  expense_number: string
  client?: {
    id: string
    name: string
    client_code: string
    markup_percentage?: number | null
  }
  workamajig_code?: string
}

interface WorkspaceHeaderProps {
  campaign: Campaign
  allocatedBudget: number
  costView: CostView
  onCostViewChange: (view: CostView) => void
  onStatusChange?: (status: CampaignStatus) => void
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

export function WorkspaceHeader({
  campaign,
  allocatedBudget,
  costView,
  onCostViewChange,
  onStatusChange,
}: WorkspaceHeaderProps) {
  const [status, setStatus] = useState<CampaignStatus>(campaign.status)
  const [isUpdating, setIsUpdating] = useState(false)

  const markupPercentage = campaign.client?.markup_percentage ?? 0
  // total_budget is always the client-approved (gross) figure; allocatedBudget
  // is the raw sum of tactic (net) budgets. Convert both to the same basis
  // before comparing, based on which view is selected.
  const displayAllocated = costView === 'gross' ? toGross(allocatedBudget, markupPercentage) : allocatedBudget
  const displayTarget = costView === 'gross' ? campaign.total_budget : toNet(campaign.total_budget, markupPercentage)

  const isOverBudget = displayAllocated > displayTarget
  const budgetColorClass = isOverBudget
    ? 'text-amber-600 font-semibold'
    : 'text-green-600 font-semibold'

  async function handleStatusChange(newStatus: CampaignStatus) {
    if (newStatus === status) return
    setIsUpdating(true)
    try {
      const res = await fetch(`/api/campaigns/${campaign.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) {
        setStatus(newStatus)
        onStatusChange?.(newStatus)
      }
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <header className="bg-card border-b border-border px-6 py-4">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-2">
        {campaign.client && (
          <>
            <span className="text-muted-foreground font-medium">{campaign.client.name}</span>
            <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
          </>
        )}
        <span className="text-foreground font-semibold">{campaign.name}</span>
      </div>

      {/* Meta row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Workamajig code */}
        {campaign.workamajig_code && (
          <Badge variant="outline" className="font-mono text-xs text-muted-foreground border-border">
            {campaign.workamajig_code}
          </Badge>
        )}

        {/* Flight dates */}
        {campaign.start_date && campaign.end_date && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
            <span>
              {formatDate(campaign.start_date)} – {formatDate(campaign.end_date)}
            </span>
          </div>
        )}

        {/* Budget */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span>Budget:</span>
          <span className={budgetColorClass}>
            {formatCurrency(displayAllocated)}
          </span>
          <span>/</span>
          <span className="text-foreground font-medium">{formatCurrency(displayTarget)}</span>
          {isOverBudget && (
            <Badge variant="outline" className="ml-1 text-xs border-amber-300 bg-amber-50 text-amber-700">
              Over Budget
            </Badge>
          )}
        </div>

        <CostViewToggle value={costView} onChange={onCostViewChange} />

        {/* Status badge (clickable dropdown) */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-auto p-0 hover:bg-transparent" disabled={isUpdating}>
              <StatusBadge status={status} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-36">
            {CAMPAIGN_STATUSES.map((s) => (
              <DropdownMenuItem
                key={s}
                onClick={() => handleStatusChange(s)}
                className={s === status ? 'font-semibold' : ''}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
