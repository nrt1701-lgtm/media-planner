import useSWR from 'swr'
import { fetcher } from '@/lib/fetcher'

export function useUtmTemplates(clientId?: string) {
  const { data, error, isLoading, mutate } = useSWR(
    `/api/utm-templates${clientId ? `?client_id=${clientId}` : ''}`,
    fetcher
  )

  return {
    templates: data ?? [],
    error,
    isLoading,
    mutate,
  }
}
