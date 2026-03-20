import useSWR from 'swr'
import { fetcher } from '@/lib/fetcher'

export function useCampaign(campaignId?: string) {
  const { data, error, isLoading, mutate } = useSWR(
    campaignId ? `/api/campaigns/${campaignId}` : null,
    fetcher
  )

  return {
    campaign: data,
    error,
    isLoading,
    mutate,
  }
}
