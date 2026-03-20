import React from 'react'
import { Document } from '@react-pdf/renderer'
import { CoverPage } from './cover-page'
import { FlowchartPages } from './flowchart-page'
import { TermsPage } from './terms-page'

interface Tactic {
  id: string
  name: string
  channel?: string | null
  platform?: string | null
  budget: number
  flight_start?: string | null
  flight_end?: string | null
}

interface AudienceStrategy {
  demographics?: {
    age_range?: string
    gender?: string
    hhi?: string
    education?: string
  }
  geographic?: {
    scope?: string
    markets?: string[]
    states?: string[]
  }
  behavioral?: {
    segments?: string[]
    interests?: string[]
  }
  custom_notes?: string
}

export interface IoDocumentProps {
  agencyLogoUrl?: string | null
  clientName: string
  campaignName: string
  workamajigCode: string
  startDate: string
  endDate: string
  totalBudget: number
  preparedBy?: string | null
  audienceStrategy?: AudienceStrategy | null
  ioTermsTemplate: string
  tactics: Tactic[]
}

export function IoDocument({
  agencyLogoUrl,
  clientName,
  campaignName,
  workamajigCode,
  startDate,
  endDate,
  totalBudget,
  preparedBy,
  audienceStrategy,
  ioTermsTemplate,
  tactics,
}: IoDocumentProps) {
  const campaignStart = new Date(startDate)
  const campaignEnd = new Date(endDate)

  return (
    <Document
      title={`IO - ${campaignName}`}
      author={preparedBy ?? undefined}
      creator="Media Planner"
    >
      <CoverPage
        agencyLogoUrl={agencyLogoUrl}
        clientName={clientName}
        campaignName={campaignName}
        workamajigCode={workamajigCode}
        startDate={startDate}
        endDate={endDate}
        totalBudget={totalBudget}
        preparedBy={preparedBy}
        audienceStrategy={audienceStrategy}
      />

      <FlowchartPages
        campaignName={campaignName}
        campaignStart={campaignStart}
        campaignEnd={campaignEnd}
        tactics={tactics}
      />

      <TermsPage ioTermsTemplate={ioTermsTemplate} />
    </Document>
  )
}
