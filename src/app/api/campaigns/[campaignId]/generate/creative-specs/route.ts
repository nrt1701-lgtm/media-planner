import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateCreativeSpecsExcel } from '@/lib/documents/creative-specs/generate'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  const { campaignId } = await params
  const supabase = await createClient()

  // 1. Fetch campaign
  const { data: campaign, error: campaignError } = await supabase
    .from('campaigns')
    .select('id, name, expense_number')
    .eq('id', campaignId)
    .single()

  if (campaignError || !campaign) {
    return Response.json({ error: 'Campaign not found' }, { status: 404 })
  }

  // 2. Fetch media plan
  const { data: mediaPlan, error: planError } = await supabase
    .from('media_plans')
    .select('id')
    .eq('campaign_id', campaignId)
    .single()

  if (planError || !mediaPlan) {
    return Response.json({ error: 'Media plan not found' }, { status: 404 })
  }

  // 3. Fetch tactics
  const { data: tactics, error: tacticsError } = await supabase
    .from('tactics')
    .select('id, name, channel, platform, placement, flight_start, ad_spec_ids')
    .eq('plan_id', mediaPlan.id)
    .order('sort_order')

  if (tacticsError) {
    return Response.json({ error: 'Failed to fetch tactics' }, { status: 500 })
  }

  // 4. Collect unique ad spec IDs
  const allSpecIds = [...new Set((tactics ?? []).flatMap(t => t.ad_spec_ids ?? []))]

  let adSpecs: {
    id: string
    platform: string
    placement: string
    format_name: string
    dimensions?: string | null
    file_types: string[]
    max_file_size?: string | null
    duration_limits?: string | null
    char_limits?: Record<string, number> | null
  }[] = []

  if (allSpecIds.length > 0) {
    const { data: specs } = await supabase
      .from('ad_spec_library')
      .select('*')
      .in('id', allSpecIds)

    adSpecs = specs ?? []
  }

  // 5. Fetch agency settings for creative lead time
  const { data: settings } = await supabase
    .from('agency_settings')
    .select('creative_lead_time_days')
    .single()

  const creativLeadTimeDays = settings?.creative_lead_time_days ?? 5

  // 6. Generate Excel
  let buffer: Buffer
  try {
    buffer = await generateCreativeSpecsExcel({
      tactics: (tactics ?? []).map(t => ({
        ...t,
        ad_spec_ids: t.ad_spec_ids ?? [],
      })),
      adSpecs,
      creativLeadTimeDays,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Excel generation failed'
    return Response.json({ error: message }, { status: 500 })
  }

  // 7. Update creative_specs_last_generated_at
  await supabase
    .from('media_plans')
    .update({ creative_specs_last_generated_at: new Date().toISOString() })
    .eq('id', mediaPlan.id)

  const filename = `Creative-Specs-${campaign.expense_number}.xlsx`
  return new Response(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': String(buffer.length),
    },
  })
}
