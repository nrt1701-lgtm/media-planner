'use client'

import { toast } from 'sonner'
import { Copy } from 'lucide-react'

const VARIABLES = [
  { token: '{platform}', description: 'Ad platform (e.g. meta, google)' },
  { token: '{channel_slug}', description: 'Channel slug (e.g. paid-social)' },
  { token: '{workamajig_code}', description: 'Workamajig project code' },
  { token: '{campaign_slug}', description: 'Slugified campaign name' },
  { token: '{format}', description: 'Ad format (e.g. single-image, video)' },
  { token: '{placement_slug}', description: 'Placement slug (e.g. feed, stories)' },
  { token: '{tactic_slug}', description: 'Slugified tactic name' },
]

export function UtmVariablePicker() {
  async function copyToken(token: string) {
    await navigator.clipboard.writeText(token)
    toast.success(`Copied ${token}`)
  }

  return (
    <div className="rounded-lg border border-border bg-muted p-4">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
        Available Variables
      </p>
      <div className="space-y-1.5">
        {VARIABLES.map(({ token, description }) => (
          <button
            key={token}
            type="button"
            onClick={() => copyToken(token)}
            className="flex items-center gap-2 w-full text-left rounded px-2 py-1.5 hover:bg-white hover:shadow-sm transition-all group"
          >
            <code className="text-xs font-mono text-brand-teal bg-brand-teal/10 px-1.5 py-0.5 rounded flex-shrink-0">
              {token}
            </code>
            <span className="text-xs text-muted-foreground flex-1 min-w-0 truncate">{description}</span>
            <Copy className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 flex-shrink-0" />
          </button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground mt-3">Click a variable to copy it to clipboard.</p>
    </div>
  )
}
