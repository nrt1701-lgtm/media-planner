import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { updateTacticSchema } from '@/lib/validators/tactic'
import { calculateImpressions } from '@/lib/impressions/calculate'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ campaignId: string; tacticId: string }> }
) {
  const { tacticId } = await params
  const supabase = await createClient()
  const body = await request.json()

  const parsed = updateTacticSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const updateData = { ...parsed.data }

  // Recalculate impressions if rate_type, budget, or rate changed
  const impressionFields = ['rate_type', 'budget', 'rate']
  const affectsImpressions = impressionFields.some((f) => f in updateData)

  if (affectsImpressions) {
    // Fetch the existing tactic to merge values
    const { data: existing, error: fetchError } = await supabase
      .from('tactics')
      .select('budget, rate, rate_type')
      .eq('id', tacticId)
      .single()

    if (fetchError) return Response.json({ error: fetchError.message }, { status: 404 })

    const mergedRateType = updateData.rate_type ?? existing.rate_type
    const mergedBudget = updateData.budget ?? existing.budget
    const mergedRate = updateData.rate ?? existing.rate

    updateData.est_impressions = calculateImpressions(mergedBudget, mergedRate, mergedRateType)
  }

  const { data, error } = await supabase
    .from('tactics')
    .update(updateData)
    .eq('id', tacticId)
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data)
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ campaignId: string; tacticId: string }> }
) {
  const { tacticId } = await params
  const supabase = await createClient()

  const { error } = await supabase
    .from('tactics')
    .delete()
    .eq('id', tacticId)

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return new Response(null, { status: 204 })
}
