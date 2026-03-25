import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  const { campaignId } = await params
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('audiences')
    .select('*')
    .eq('campaign_id', campaignId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data)
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  const { campaignId } = await params
  const supabase = await createClient()

  const { data: existing } = await supabase
    .from('audiences')
    .select('sort_order')
    .eq('campaign_id', campaignId)
    .order('sort_order', { ascending: false })
    .limit(1)

  const nextOrder = existing && existing.length > 0 ? (existing[0].sort_order + 1) : 0

  const { data, error } = await supabase
    .from('audiences')
    .insert({
      campaign_id: campaignId,
      name: 'New Audience',
      audience_strategy: {},
      sort_order: nextOrder,
    })
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data, { status: 201 })
}
