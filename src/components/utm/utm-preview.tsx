'use client'

import { interpolateUtm } from '@/lib/utm/interpolate'
import { slugify } from '@/lib/utm/slugify'

interface UtmPreviewProps {
  sourcePattern: string
  mediumPattern: string
  campaignPattern: string
  contentPattern: string
  termPattern?: string | null
}

const SAMPLE_VARS: Record<string, string> = {
  platform: 'meta',
  channel_slug: slugify('Paid Social'),
  workamajig_code: 'PRJ-2026-001',
  campaign_slug: slugify('Spring Brand Awareness'),
  format: 'single-image',
  placement_slug: slugify('Feed'),
  tactic_slug: slugify('Retargeting 18-34'),
}

function buildUtmString(params: Record<string, string>) {
  return (
    '?' +
    Object.entries(params)
      .filter(([, v]) => v)
      .map(([k, v]) => `utm_${k}=${encodeURIComponent(v)}`)
      .join('&')
  )
}

export function UtmPreview({
  sourcePattern,
  mediumPattern,
  campaignPattern,
  contentPattern,
  termPattern,
}: UtmPreviewProps) {
  const source = interpolateUtm(sourcePattern, SAMPLE_VARS)
  const medium = interpolateUtm(mediumPattern, SAMPLE_VARS)
  const campaign = interpolateUtm(campaignPattern, SAMPLE_VARS)
  const content = interpolateUtm(contentPattern, SAMPLE_VARS)
  const term = termPattern ? interpolateUtm(termPattern, SAMPLE_VARS) : ''

  const utmString = buildUtmString({
    source,
    medium,
    campaign,
    content,
    ...(term ? { term } : {}),
  })

  const preview = `https://example.com/landing-page${utmString}`

  return (
    <div className="rounded-lg border border-border bg-muted p-4">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
        Live Preview
      </p>

      <div className="space-y-2 mb-3">
        {[
          { label: 'utm_source', value: source },
          { label: 'utm_medium', value: medium },
          { label: 'utm_campaign', value: campaign },
          { label: 'utm_content', value: content },
          ...(term ? [{ label: 'utm_term', value: term }] : []),
        ].map(({ label, value }) => (
          <div key={label} className="flex gap-2 text-xs">
            <span className="font-mono text-muted-foreground w-32 flex-shrink-0">{label}:</span>
            <span className="font-mono text-brand-teal break-all">{value || <em className="text-muted-foreground not-italic">empty</em>}</span>
          </div>
        ))}
      </div>

      <div className="mt-3 pt-3 border-t border-border">
        <p className="text-xs text-muted-foreground mb-1 font-medium">Full URL:</p>
        <p className="text-xs font-mono text-foreground break-all bg-background rounded border border-border px-2 py-1.5">
          {preview}
        </p>
      </div>

      <p className="text-xs text-muted-foreground mt-2">
        Sample values used for preview. Actual values populate at export time.
      </p>
    </div>
  )
}
