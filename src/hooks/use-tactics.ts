import useSWR from 'swr'
import { fetcher } from '@/lib/fetcher'

export function useTactics(campaignId?: string) {
  const { data, error, isLoading, mutate } = useSWR(
    campaignId ? `/api/campaigns/${campaignId}/tactics` : null,
    fetcher
  )

  return {
    tactics: data ?? [],
    error,
    isLoading,
    mutate,
  }
}
