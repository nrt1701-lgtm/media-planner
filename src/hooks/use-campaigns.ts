import useSWR from 'swr'
import { fetcher } from '@/lib/fetcher'

export function useCampaigns(clientId?: string) {
  const { data, error, isLoading, mutate } = useSWR(
    clientId ? `/api/campaigns?client_id=${clientId}` : null,
    fetcher
  )

  return {
    campaigns: data ?? [],
    error,
    isLoading,
    mutate,
  }
}
