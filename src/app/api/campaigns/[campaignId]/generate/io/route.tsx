import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { renderToBuffer, Document } from '@react-pdf/renderer'
import { IoDocument } from '@/lib/documents/io-pdf/io-document'
import React from 'react'
import type { ComponentProps } from 'react'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  const { campaignId } = await params
  const supabase = await createClient()

  // 1. Fetch campaign with client
  const { data: campaign, error: campaignError } = await supabase
    .from('campaigns')
    .select('*, clients(id, name)')
    .eq('id', campaignId)
    .single()

  if (campaignError || !campaign) {
    return Response.json({ error: 'Campaign not found' }, { status: 404 })
  }

  // 2. Fetch media plan
  const { data: mediaPlan, error: planError } = await supabase
    .from('media_plans')
    .select('*')
    .eq('campaign_id', campaignId)
    .single()

  if (planError || !mediaPlan) {
    return Response.json({ error: 'Media plan not found' }, { status: 404 })
  }

  // 3. Fetch tactics
  const { data: tactics, error: tacticsError } = await supabase
    .from('tactics')
    .select('id, name, channel, platform, budget, flight_start, flight_end')
    .eq('plan_id', mediaPlan.id)
    .order('sort_order')

  if (tacticsError) {
    return Response.json({ error: 'Failed to fetch tactics' }, { status: 500 })
  }

  // 4. Fetch agency settings
  const { data: settings } = await supabase
    .from('agency_settings')
    .select('agency_logo_url, io_terms_template')
    .single()

  const client = campaign.clients as { id: string; name: string } | null

  // 5. Render to PDF buffer
  let pdfBuffer: Buffer
  try {
    const docElement = (
      <IoDocument
        agencyLogoUrl={settings?.agency_logo_url ?? null}
        clientName={client?.name ?? 'Unknown Client'}
        campaignName={campaign.name}
        workamajigCode={campaign.expense_number}
        startDate={campaign.start_date}
        endDate={campaign.end_date}
        totalBudget={campaign.total_budget}
        preparedBy={mediaPlan.prepared_by ?? null}
        audienceStrategy={mediaPlan.audience_strategy ?? null}
        ioTermsTemplate={settings?.io_terms_template ?? ''}
        tactics={tactics ?? []}
      />
    ) as React.ReactElement<ComponentProps<typeof Document>>
    pdfBuffer = await renderToBuffer(docElement)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'PDF render failed'
    return Response.json({ error: message }, { status: 500 })
  }

  // 6. Update io_last_generated_at
  await supabase
    .from('media_plans')
    .update({ io_last_generated_at: new Date().toISOString() })
    .eq('id', mediaPlan.id)

  // 7. Return PDF
  const filename = `IO-${campaign.expense_number}.pdf`
  return new Response(new Uint8Array(pdfBuffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': String(pdfBuffer.length),
    },
  })
}
