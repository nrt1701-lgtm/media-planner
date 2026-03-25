import useSWR from 'swr'
import { fetcher } from '@/lib/fetcher'

export interface AudienceStrategy {
  demographics: {
    age_range: string
    gender: string
    hhi: string
    education: string
  }
  geographic: {
    scope: 'national' | 'local'
    markets: string[]
    states: string[]
  }
  behavioral: {
    segments: string[]
    interests: string[]
  }
  custom_notes: string
}

export interface Audience {
  id: string
  campaign_id: string
  name: string
  audience_strategy: AudienceStrategy
  sort_order: number
  created_at: string
}

export function useAudiences(campaignId: string) {
  const { data, error, isLoading, mutate } = useSWR<Audience[]>(
    campaignId ? `/api/campaigns/${campaignId}/audiences` : null,
    fetcher
  )
  return { audiences: data ?? [], error, isLoading, mutate }
}
