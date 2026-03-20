import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateUtmSheetExcel } from '@/lib/documents/utm-sheet/generate'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  const { campaignId } = await params
  const supabase = await createClient()

  // 1. Fetch campaign with client
  const { data: campaign, error: campaignError } = await supabase
    .from('campaigns')
    .select('id, name, expense_number, default_landing_page, client_id')
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
    .select('id, name, channel, platform, placement, landing_page_url')
    .eq('plan_id', mediaPlan.id)
    .order('sort_order')

  if (tacticsError) {
    return Response.json({ error: 'Failed to fetch tactics' }, { status: 500 })
  }

  // 4. Fetch UTM templates — client-specific + global
  const { data: clientTemplates } = await supabase
    .from('utm_templates')
    .select('*')
    .eq('client_id', campaign.client_id)

  const { data: globalTemplates } = await supabase
    .from('utm_templates')
    .select('*')
    .is('client_id', null)

  const allTemplates = [...(clientTemplates ?? []), ...(globalTemplates ?? [])]

  // 5. Generate Excel
  let buffer: Buffer
  try {
    buffer = await generateUtmSheetExcel({
      campaign: {
        name: campaign.name,
        expense_number: campaign.expense_number,
        default_landing_page: campaign.default_landing_page ?? null,
      },
      tactics: tactics ?? [],
      utmTemplates: allTemplates,
      clientId: campaign.client_id,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Excel generation failed'
    return Response.json({ error: message }, { status: 500 })
  }

  // 6. Update utm_sheet_last_generated_at
  await supabase
    .from('media_plans')
    .update({ utm_sheet_last_generated_at: new Date().toISOString() })
    .eq('id', mediaPlan.id)

  const filename = `UTM-Sheet-${campaign.expense_number}.xlsx`
  return new Response(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': String(buffer.length),
    },
  })
}
