import useSWR from 'swr'
import { fetcher } from '@/lib/fetcher'

export function useTactics(campaignId?: string) {
  const { data, error, isLoading, mutate } = useSWR(
    campaignId ? `/api/campaigns/${campaignId}/tactics` : null,
    fetcher,
    // Prevent SWR from re-fetching already-cached tactics when TacticsGrid
    // remounts (e.g. after switching away from the Tactics tab and back).
    // Without this, a stale GET response can overwrite optimistic PATCH
    // updates that are still in-flight, zeroing out fields like budget.
    // Unlike revalidateOnMount: false, this still performs the initial
    // fetch when no data has been loaded yet (e.g. first time opening a
    // campaign), and revalidateOnFocus still runs so data stays fresh on
    // browser-tab switches.
    { revalidateIfStale: false }
  )

  return {
    tactics: data ?? [],
    error,
    isLoading,
    mutate,
  }
}
