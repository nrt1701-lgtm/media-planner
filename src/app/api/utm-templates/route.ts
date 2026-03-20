import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createUtmTemplateSchema } from '@/lib/validators/utm-template'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const clientId = request.nextUrl.searchParams.get('client_id')

  let query = supabase
    .from('utm_templates')
    .select('*')
    .order('name')

  if (clientId) {
    query = query.eq('client_id', clientId)
  }

  const { data, error } = await query

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data)
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const body = await request.json()

  const parsed = createUtmTemplateSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('utm_templates')
    .insert(parsed.data)
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data, { status: 201 })
}
