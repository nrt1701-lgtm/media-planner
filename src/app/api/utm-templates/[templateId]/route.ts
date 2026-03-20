import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { updateUtmTemplateSchema } from '@/lib/validators/utm-template'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ templateId: string }> }
) {
  const { templateId } = await params
  const supabase = await createClient()
  const body = await request.json()

  const parsed = updateUtmTemplateSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('utm_templates')
    .update(parsed.data)
    .eq('id', templateId)
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data)
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ templateId: string }> }
) {
  const { templateId } = await params
  const supabase = await createClient()

  const { error } = await supabase
    .from('utm_templates')
    .delete()
    .eq('id', templateId)

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return new Response(null, { status: 204 })
}
