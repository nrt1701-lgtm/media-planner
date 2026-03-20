import useSWR from 'swr'
import { fetcher } from '@/lib/fetcher'

export function useSettings() {
  const { data, error, isLoading, mutate } = useSWR('/api/settings', fetcher)

  return {
    settings: data,
    error,
    isLoading,
    mutate,
  }
}
