'use client'

import { AlertCircle } from 'lucide-react'

interface Tactic {
  id: string
  channel?: string | null
  start_date?: string | null
  end_date?: string | null
  name?: string | null
}

interface Campaign {
  start_date?: string | null
  end_date?: string | null
}

interface CompletenessChecklistProps {
  campaign: Campaign
  tactics: Tactic[]
}

export function CompletenessChecklist({ campaign, tactics }: CompletenessChecklistProps) {
  const warnings: string[] = []

  if (!campaign.start_date || !campaign.end_date) {
    warnings.push('Campaign is missing flight dates')
  }

  if (tactics.length === 0) {
    warnings.push('No tactics have been added to this campaign')
  }

  const tacticsWithoutChannel = tactics.filter((t) => !t.channel)
  if (tacticsWithoutChannel.length > 0) {
    warnings.push(`${tacticsWithoutChannel.length} tactic(s) are missing a channel assignment`)
  }

  const tacticsWithoutDates = tactics.filter((t) => !t.start_date || !t.end_date)
  if (tacticsWithoutDates.length > 0) {
    warnings.push(`${tacticsWithoutDates.length} tactic(s) are missing flight dates`)
  }

  if (warnings.length === 0) return null

  return (
    <div className="rounded-md border border-amber-200 bg-amber-50 p-3">
      <div className="flex items-start gap-2">
        <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-medium text-amber-800">Review before generating</p>
          <ul className="mt-1 space-y-0.5">
            {warnings.map((w, i) => (
              <li key={i} className="text-xs text-amber-700">
                {w}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
