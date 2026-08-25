import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { CAMPAIGN_STATUSES } from '@/lib/constants'

const IN_SCOPE_STATUSES: (typeof CAMPAIGN_STATUSES)[number][] = ['planning', 'approved', 'active']

interface RawTactic {
  id: string
  platform: string | null
  budget: number | null
  flight_start: string | null
  flight_end: string | null
}

interface RawMediaPlan {
  id: string
  tactics: RawTactic[] | null
}

interface RawCampaign {
  id: string
  name: string
  total_budget: number | null
  start_date: string | null
  end_date: string | null
  status: string
  media_plans: RawMediaPlan[] | RawMediaPlan | null
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const { clientId } = await params
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('campaigns')
    .select(
      'id, name, total_budget, start_date, end_date, status, media_plans(id, tactics(id, platform, budget, flight_start, flight_end))'
    )
    .eq('client_id', clientId)
    .is('deleted_at', null)
    .in('status', IN_SCOPE_STATUSES)

  if (error) return Response.json({ error: error.message }, { status: 500 })

  const rows = data as unknown as RawCampaign[]

  const campaigns = rows.map((c) => ({
    id: c.id,
    name: c.name,
    total_budget: c.total_budget,
    start_date: c.start_date,
    end_date: c.end_date,
    status: c.status,
  }))

  const tactics = rows.flatMap((c) => {
    const plans = Array.isArray(c.media_plans) ? c.media_plans : c.media_plans ? [c.media_plans] : []
    return plans.flatMap((p) => (p.tactics ?? []).map((t) => ({ ...t, campaign_id: c.id })))
  })

  return Response.json({ campaigns, tactics })
}
