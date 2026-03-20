import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('channels')
    .select('*')
    .order('sort_order')

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data)
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const body = await request.json()

  if (!body.name || typeof body.name !== 'string') {
    return Response.json({ error: 'Channel name is required.' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('channels')
    .insert({ name: body.name, sort_order: body.sort_order ?? 0 })
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data, { status: 201 })
}
