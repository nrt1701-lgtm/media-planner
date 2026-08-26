import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { updateCampaignSchema } from '@/lib/validators/campaign'

interface RawMediaPlan {
  id: string
}

interface RawClient {
  id: string
  name: string
  client_code: string
  markup_percentage: number
}

function flattenCampaign(
  data: Record<string, unknown> & { media_plans: RawMediaPlan[] | RawMediaPlan | null; clients: RawClient[] | RawClient | null }
) {
  const { media_plans, clients, ...campaign } = data
  const plans = Array.isArray(media_plans) ? media_plans : media_plans ? [media_plans] : []
  const client = Array.isArray(clients) ? (clients[0] ?? null) : clients

  return {
    ...campaign,
    plan_id: plans.length > 0 ? plans[0].id : null,
    client,
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  const { campaignId } = await params
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('campaigns')
    .select('*, media_plans(id), clients(id, name, client_code, markup_percentage)')
    .eq('id', campaignId)
    .single()

  if (error) return Response.json({ error: error.message }, { status: 404 })

  return Response.json(flattenCampaign(data as never))
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
    .select('*, media_plans(id), clients(id, name, client_code, markup_percentage)')
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })

  return Response.json(flattenCampaign(data as never))
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
