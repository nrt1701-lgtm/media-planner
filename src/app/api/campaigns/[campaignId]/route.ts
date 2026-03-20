import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { updateCampaignSchema } from '@/lib/validators/campaign'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  const { campaignId } = await params
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('campaigns')
    .select('*, media_plans(id)')
    .eq('id', campaignId)
    .single()

  if (error) return Response.json({ error: error.message }, { status: 404 })

  const { media_plans, ...campaign } = data as typeof data & { media_plans: { id: string }[] }
  const result = {
    ...campaign,
    plan_id: Array.isArray(media_plans) && media_plans.length > 0 ? media_plans[0].id : null,
  }

  return Response.json(result)
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  const { campaignId } = await params
  const supabase = await createClient()
  const body = await request.json()

  const parsed = updateCampaignSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('campaigns')
    .update(parsed.data)
    .eq('id', campaignId)
    .select('*, media_plans(id)')
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })

  const { media_plans, ...campaign } = data as typeof data & { media_plans: { id: string }[] }
  const result = {
    ...campaign,
    plan_id: Array.isArray(media_plans) && media_plans.length > 0 ? media_plans[0].id : null,
  }

  return Response.json(result)
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  const { campaignId } = await params
  const supabase = await createClient()

  const { error } = await supabase
    .from('campaigns')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', campaignId)

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return new Response(null, { status: 204 })
}
