export const CAMPAIGN_STATUSES = ['draft', 'planning', 'approved', 'active', 'completed'] as const
export type CampaignStatus = typeof CAMPAIGN_STATUSES[number]

export const RATE_TYPES = ['CPM', 'CPC', 'CPA', 'flat_rate', 'custom'] as const
export type RateType = typeof RATE_TYPES[number]

export const FUNNEL_STAGES = ['Awareness', 'Consideration', 'Conversion'] as const
export type FunnelStage = typeof FUNNEL_STAGES[number]

export const STATUS_COLORS: Record<CampaignStatus, string> = {
  draft:     'bg-brand-sand text-brand-canyon',
  planning:  'bg-brand-teal/15 text-brand-teal',
  approved:  'bg-brand-gold/20 text-brand-canyon',
  active:    'bg-brand-rust/15 text-brand-rust',
  completed: 'bg-brand-dusk/15 text-brand-dusk',
}
