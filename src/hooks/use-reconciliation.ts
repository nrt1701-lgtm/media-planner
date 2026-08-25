import useSWR from 'swr'
import { fetcher } from '@/lib/fetcher'

export function useReconciliation(clientId?: string) {
  const { data, error, isLoading, mutate } = useSWR(
    clientId ? `/api/clients/${clientId}/reconciliation` : null,
    fetcher
  )

  return {
    campaigns: data?.campaigns ?? [],
    tactics: data?.tactics ?? [],
    error,
    isLoading,
    mutate,
  }
}
