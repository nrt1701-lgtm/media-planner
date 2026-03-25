import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ campaignId: string; audienceId: string }> }
) {
  const { audienceId } = await params
  const supabase = await createClient()
  const body = await request.json()

  const allowed: Record<string, unknown> = {}
  if ('name' in body) allowed.name = body.name
  if ('audience_strategy' in body) allowed.audience_strategy = body.audience_strategy

  const { data, error } = await supabase
    .from('audiences')
    .update({ ...allowed, updated_at: new Date().toISOString() })
    .eq('id', audienceId)
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data)
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ campaignId: string; audienceId: string }> }
) {
  const { audienceId } = await params
  const supabase = await createClient()

  const { error } = await supabase
    .from('audiences')
    .delete()
    .eq('id', audienceId)

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return new Response(null, { status: 204 })
}
