import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { updateAdSpecSchema } from '@/lib/validators/ad-spec'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ specId: string }> }
) {
  const { specId } = await params
  const supabase = await createClient()
  const body = await request.json()

  const parsed = updateAdSpecSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('ad_spec_library')
    .update(parsed.data)
    .eq('id', specId)
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data)
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ specId: string }> }
) {
  const { specId } = await params
  const supabase = await createClient()

  const { error } = await supabase
    .from('ad_spec_library')
    .delete()
    .eq('id', specId)

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return new Response(null, { status: 204 })
}
