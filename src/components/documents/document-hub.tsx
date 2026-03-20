'use client'

import { useState } from 'react'
import { DocumentCard } from './document-card'
import { CompletenessChecklist } from './completeness-checklist'
import { IoPreview } from './io-preview'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface Tactic {
  id: string
  channel?: string | null
  start_date?: string | null
  end_date?: string | null
  name?: string | null
}

interface Campaign {
  id: string
  name?: string | null
  start_date?: string | null
  end_date?: string | null
  workamajig_code?: string | null
}

interface DocumentHubProps {
  campaignId: string
  campaign: Campaign
  tactics: Tactic[]
}

export function DocumentHub({ campaignId, campaign, tactics }: DocumentHubProps) {
  const [ioPreviewOpen, setIoPreviewOpen] = useState(false)

  return (
    <div className="p-6 max-w-3xl space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Generate Documents</h2>
        <p className="text-sm text-gray-500 mt-1">
          Export your media plan as structured documents for trafficking and client delivery.
        </p>
      </div>

      <CompletenessChecklist campaign={campaign} tactics={tactics} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <DocumentCard
          title="Insertion Order"
          description="IO PDF with media flowchart, flight dates, and budget breakdown."
          downloadEndpoint={`/api/campaigns/${campaignId}/generate/io`}
          fileName={`IO-${campaign.workamajig_code ?? campaignId}.pdf`}
          campaignId={campaignId}
          canPreview
          onPreview={() => setIoPreviewOpen(true)}
        />

        <DocumentCard
          title="Creative Specifications"
          description="Creative specs by channel and placement for trafficking."
          downloadEndpoint={`/api/campaigns/${campaignId}/generate/creative-specs`}
          fileName={`Creative-Specs-${campaign.workamajig_code ?? campaignId}.xlsx`}
          campaignId={campaignId}
        />

        <DocumentCard
          title="UTM Tracking Sheet"
          description="UTM parameter sheet for campaign tracking and analytics."
          downloadEndpoint={`/api/campaigns/${campaignId}/generate/utm-sheet`}
          fileName={`UTM-Sheet-${campaign.workamajig_code ?? campaignId}.xlsx`}
          campaignId={campaignId}
        />
      </div>

      <Dialog open={ioPreviewOpen} onOpenChange={setIoPreviewOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>IO Preview — {campaign.name}</DialogTitle>
          </DialogHeader>
          <IoPreview
            campaignId={campaignId}
            workamajigCode={campaign.workamajig_code ?? undefined}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
