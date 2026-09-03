import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAudienceSchema } from '@/lib/validators/audience'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  const { campaignId } = await params
  const supabase = await createClient()

  const body = await request.json()
  if (!Array.isArray(body?.audiences)) {
    return Response.json({ error: 'Request body must be { audiences: [...] }' }, { status: 400 })
  }

  // Determine the current max sort_order so new rows are appended after existing audiences
  const { data: existing } = await supabase
    .from('audiences')
    .select('sort_order')
    .eq('campaign_id', campaignId)
    .order('sort_order', { ascending: false })
    .limit(1)

  const startOrder = (existing?.[0]?.sort_order ?? -1) + 1

  const created: Array<Record<string, unknown>> = []
  const errors: { row: number; error: unknown }[] = []

  for (let i = 0; i < body.audiences.length; i++) {
    const parsed = createAudienceSchema.safeParse(body.audiences[i])
    if (!parsed.success) {
      errors.push({ row: i, error: parsed.error.flatten() })
      continue
    }

    created.push({
      ...parsed.data,
      campaign_id: campaignId,
      sort_order: startOrder + (created.length + errors.length),
    })
  }

  if (created.length === 0) {
    return Response.json({ created: [], errors }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('audiences')
    .insert(created)
    .select()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ created: data, errors }, { status: 201 })
}
