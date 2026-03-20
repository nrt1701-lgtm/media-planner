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

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  const { campaignId } = await params
  const supabase = await createClient()

  const planId = await getPlanId(supabase, campaignId)
  if (!planId) return Response.json({ error: 'Media plan not found for campaign.' }, { status: 404 })

  const { data, error } = await supabase
    .from('tactics')
    .select('*')
    .eq('plan_id', planId)
    .order('sort_order')

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data)
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
  const parsed = createTacticSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const tacticData = { ...parsed.data, plan_id: planId }

  // Auto-calculate impressions for CPM
  if (tacticData.rate_type === 'CPM' && tacticData.est_impressions == null) {
    tacticData.est_impressions = calculateImpressions(tacticData.budget, tacticData.rate, 'CPM')
  }

  const { data, error } = await supabase
    .from('tactics')
    .insert(tacticData)
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data, { status: 201 })
}
