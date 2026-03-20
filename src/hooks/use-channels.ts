import useSWR from 'swr'
import { fetcher } from '@/lib/fetcher'

export function useChannels() {
  const { data, error, isLoading, mutate } = useSWR('/api/channels', fetcher)

  return {
    channels: data ?? [],
    error,
    isLoading,
    mutate,
  }
}
