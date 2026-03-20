import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createCampaignSchema } from '@/lib/validators/campaign'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const clientId = request.nextUrl.searchParams.get('client_id')

  let query = supabase
    .from('campaigns')
    .select('*, media_plans(id)')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (clientId) {
    query = query.eq('client_id', clientId)
  }

  const { data, error } = await query

  if (error) return Response.json({ error: error.message }, { status: 500 })

  // Flatten media_plans to plan_id
  const campaigns = data.map(({ media_plans, ...campaign }) => ({
    ...campaign,
    plan_id: Array.isArray(media_plans) && media_plans.length > 0 ? media_plans[0].id : null,
  }))

  return Response.json(campaigns)
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const body = await request.json()

  const parsed = createCampaignSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('campaigns')
    .insert(parsed.data)
    .select('*, media_plans(id)')
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })

  const { media_plans, ...campaign } = data as typeof data & { media_plans: { id: string }[] }
  const result = {
    ...campaign,
    plan_id: Array.isArray(media_plans) && media_plans.length > 0 ? media_plans[0].id : null,
  }

  return Response.json(result, { status: 201 })
}
