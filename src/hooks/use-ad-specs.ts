import useSWR from 'swr'
import { fetcher } from '@/lib/fetcher'

export function useAdSpecs(platform?: string) {
  const { data, error, isLoading, mutate } = useSWR(
    `/api/ad-specs${platform ? `?platform=${platform}` : ''}`,
    fetcher
  )

  return {
    adSpecs: data ?? [],
    error,
    isLoading,
    mutate,
  }
}
