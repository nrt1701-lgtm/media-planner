export const CAMPAIGN_STATUSES = ['draft', 'planning', 'approved', 'active', 'completed'] as const
export type CampaignStatus = typeof CAMPAIGN_STATUSES[number]

export const RATE_TYPES = ['CPM', 'CPC', 'CPA', 'flat_rate', 'custom'] as const
export type RateType = typeof RATE_TYPES[number]

export const STATUS_COLORS: Record<CampaignStatus, string> = {
  draft: 'bg-gray-100 text-gray-700',
  planning: 'bg-blue-100 text-blue-700',
  approved: 'bg-green-100 text-green-700',
  active: 'bg-purple-100 text-purple-700',
  completed: 'bg-gray-50 text-gray-500',
}
