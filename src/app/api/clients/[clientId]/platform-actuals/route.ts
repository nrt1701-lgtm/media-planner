import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { upsertPlatformActualSchema } from '@/lib/validators/platform-actual'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const { clientId } = await params
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('platform_actuals')
    .select('*')
    .eq('client_id', clientId)

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data)
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const { clientId } = await params
  const supabase = await createClient()

  const body = await request.json()
  const parsed = upsertPlatformActualSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('platform_actuals')
    .upsert(
      { client_id: clientId, ...parsed.data },
      { onConflict: 'client_id,platform,month' }
    )
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data, { status: 201 })
}
