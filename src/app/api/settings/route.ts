import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { updateSettingsSchema } from '@/lib/validators/settings'

export async function GET() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('agency_settings')
    .select('*')
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data)
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const body = await request.json()

  const parsed = updateSettingsSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  // Fetch current settings to get the id
  const { data: existing, error: fetchError } = await supabase
    .from('agency_settings')
    .select('id')
    .single()

  if (fetchError) return Response.json({ error: fetchError.message }, { status: 500 })

  const { data, error } = await supabase
    .from('agency_settings')
    .update(parsed.data)
    .eq('id', existing.id)
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data)
}
