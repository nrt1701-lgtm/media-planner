import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdSpecSchema } from '@/lib/validators/ad-spec'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const platform = request.nextUrl.searchParams.get('platform')
  const search = request.nextUrl.searchParams.get('search')

  let query = supabase
    .from('ad_specs')
    .select('*')
    .order('platform')
    .order('placement')

  if (platform) {
    query = query.eq('platform', platform)
  }

  if (search) {
    query = query.or(
      `platform.ilike.%${search}%,placement.ilike.%${search}%,format_name.ilike.%${search}%`
    )
  }

  const { data, error } = await query

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data)
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const body = await request.json()

  const parsed = createAdSpecSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('ad_specs')
    .insert(parsed.data)
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data, { status: 201 })
}
