import useSWR from 'swr'
import { fetcher } from '@/lib/fetcher'

export interface PlatformActual {
  id: string
  client_id: string
  platform: string
  month: string
  actual_spend: number
}

export function usePlatformActuals(clientId?: string) {
  const { data, error, isLoading, mutate } = useSWR(
    clientId ? `/api/clients/${clientId}/platform-actuals` : null,
    fetcher,
    { revalidateIfStale: false }
  )

  async function saveActual(platform: string, month: string, actualSpend: number) {
    const current: PlatformActual[] = data ?? []
    const optimistic = [
      ...current.filter((a) => !(a.platform === platform && a.month.slice(0, 7) === month.slice(0, 7))),
      { id: `optimistic-${platform}-${month}`, client_id: clientId!, platform, month, actual_spend: actualSpend },
    ]
    mutate(optimistic, false)

    const res = await fetch(`/api/clients/${clientId}/platform-actuals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ platform, month, actual_spend: actualSpend }),
    })

    if (res.ok) {
      const saved: PlatformActual = await res.json()
      mutate(
        (curr: PlatformActual[] | undefined) => [
          ...(curr ?? []).filter((a) => a.id !== saved.id && !(a.platform === platform && a.month.slice(0, 7) === month.slice(0, 7))),
          saved,
        ],
        false
      )
    } else {
      mutate()
    }
  }

  return {
    actuals: data ?? [],
    error,
    isLoading,
    saveActual,
  }
}
