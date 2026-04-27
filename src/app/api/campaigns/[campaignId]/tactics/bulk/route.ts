import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createTacticSchema } from '@/lib/validators/tactic'
import { calculateImpressions } from '@/lib/impressions/calculate'

async function getPlanId(supabase: Awaited<ReturnType<typeof createClient>>, campaignId: string) {
  const { data, error } = await supabase
    .from('media_plans')
    .select('id')
    .eq('campaign_id', campaignId)
    .single()

  if (error || !data) return null
  return data.id
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  const { campaignId } = await params
  const supabase = await createClient()

  const planId = await getPlanId(supabase, campaignId)
  if (!planId) return Response.json({ error: 'Media plan not found for campaign.' }, { status: 404 })

  const body = await request.json()
  if (!Array.isArray(body?.tactics)) {
    return Response.json({ error: 'Request body must be { tactics: [...] }' }, { status: 400 })
  }

  // Determine the current max sort_order so new rows are appended after existing tactics
  const { data: existing } = await supabase
    .from('tactics')
    .select('sort_order')
    .eq('plan_id', planId)
    .order('sort_order', { ascending: false })
    .limit(1)

  const startOrder = (existing?.[0]?.sort_order ?? -1) + 1

  const created: Array<Record<string, unknown>> = []
  const errors: { row: number; error: unknown }[] = []

  for (let i = 0; i < body.tactics.length; i++) {
    const parsed = createTacticSchema.safeParse(body.tactics[i])
    if (!parsed.success) {
      errors.push({ row: i, error: parsed.error.flatten() })
      continue
    }

    const tacticData = {
      ...parsed.data,
      plan_id: planId,
      sort_order: startOrder + (created.length + errors.length),
    }

    if (tacticData.rate_type === 'CPM' && tacticData.est_impressions == null) {
      tacticData.est_impressions = calculateImpressions(tacticData.budget, tacticData.rate, 'CPM')
    }

    created.push(tacticData)
  }

  if (created.length === 0) {
    return Response.json({ created: [], errors }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('tactics')
    .insert(created)
    .select()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ created: data, errors }, { status: 201 })
}
