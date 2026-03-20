import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { updateMediaPlanSchema } from '@/lib/validators/media-plan'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  const { campaignId } = await params
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('media_plans')
    .select('*')
    .eq('campaign_id', campaignId)
    .single()

  if (error) return Response.json({ error: error.message }, { status: 404 })
  return Response.json(data)
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  const { campaignId } = await params
  const supabase = await createClient()
  const body = await request.json()

  const parsed = updateMediaPlanSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('media_plans')
    .update(parsed.data)
    .eq('campaign_id', campaignId)
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data)
}
