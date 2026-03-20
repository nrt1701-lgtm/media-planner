import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const reorderSchema = z.array(z.object({
  id: z.string().uuid(),
  sort_order: z.number().int(),
}))

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  // campaignId not needed for bulk update but required by route signature
  await params

  const supabase = await createClient()
  const body = await request.json()

  const parsed = reorderSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  // Bulk update sort_order for each tactic
  const updates = parsed.data.map(({ id, sort_order }) =>
    supabase
      .from('tactics')
      .update({ sort_order })
      .eq('id', id)
  )

  const results = await Promise.all(updates)
  const firstError = results.find((r) => r.error)
  if (firstError?.error) {
    return Response.json({ error: firstError.error.message }, { status: 500 })
  }

  return Response.json({ success: true })
}
