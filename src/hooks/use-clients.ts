import useSWR from 'swr'
import { fetcher } from '@/lib/fetcher'

export function useClients() {
  const { data, error, isLoading, mutate } = useSWR('/api/clients', fetcher)

  return {
    clients: data ?? [],
    error,
    isLoading,
    mutate,
  }
}
