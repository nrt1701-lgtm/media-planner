import React from 'react'
import { Page, View, Text, Image } from '@react-pdf/renderer'
import { styles } from './styles'
import { format } from 'date-fns'

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

interface CoverPageProps {
  agencyLogoUrl?: string | null
  clientName: string
  campaignName: string
  workamajigCode: string
  startDate: string
  endDate: string
  totalBudget: number
  preparedBy?: string | null
  audienceStrategy?: AudienceStrategy | null
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatDateRange(start: string, end: string): string {
  try {
    const s = format(new Date(start), 'MMMM d, yyyy')
    const e = format(new Date(end), 'MMMM d, yyyy')
    return `${s} – ${e}`
  } catch {
    return `${start} – ${end}`
  }
}

function summarizeAudience(strategy: AudienceStrategy | null | undefined): string {
  if (!strategy) return ''
  const parts: string[] = []

  const demo = strategy.demographics
  if (demo) {
    if (demo.age_range) parts.push(`Age: ${demo.age_range}`)
    if (demo.gender) parts.push(`Gender: ${demo.gender}`)
    if (demo.hhi) parts.push(`HHI: ${demo.hhi}`)
  }

  const geo = strategy.geographic
  if (geo) {
    if (geo.scope === 'national') {
      parts.push('Geography: National')
    } else if (geo.markets && geo.markets.length > 0) {
      parts.push(`Markets: ${geo.markets.slice(0, 3).join(', ')}${geo.markets.length > 3 ? ` +${geo.markets.length - 3} more` : ''}`)
    } else if (geo.states && geo.states.length > 0) {
      parts.push(`States: ${geo.states.slice(0, 3).join(', ')}${geo.states.length > 3 ? ` +${geo.states.length - 3} more` : ''}`)
    }
  }

  const behav = strategy.behavioral
  if (behav) {
    if (behav.segments && behav.segments.length > 0) {
      parts.push(`Segments: ${behav.segments.slice(0, 3).join(', ')}`)
    }
  }

  if (strategy.custom_notes) {
    parts.push(strategy.custom_notes.slice(0, 100))
  }

  return parts.join(' | ')
}

export function CoverPage({
  agencyLogoUrl,
  clientName,
  campaignName,
  workamajigCode,
  startDate,
  endDate,
  totalBudget,
  preparedBy,
  audienceStrategy,
}: CoverPageProps) {
  const audienceSummary = summarizeAudience(audienceStrategy)
  const generationDate = format(new Date(), 'MMMM d, yyyy')

  return (
    <Page size="LETTER" style={styles.coverPage}>
      <View>
        {agencyLogoUrl ? (
          <Image src={agencyLogoUrl} style={styles.coverLogo} />
        ) : null}

        <View style={styles.coverDivider} />

        <Text style={styles.coverTitle}>{campaignName}</Text>
        <Text style={styles.coverSubtitle}>{clientName}</Text>

        <View style={{ marginTop: 8 }}>
          <View style={styles.coverMetaRow}>
            <Text style={styles.coverMetaLabel}>Workamajig Code</Text>
            <Text style={styles.coverMetaValue}>{workamajigCode}</Text>
          </View>
          <View style={styles.coverMetaRow}>
            <Text style={styles.coverMetaLabel}>Flight Dates</Text>
            <Text style={styles.coverMetaValue}>{formatDateRange(startDate, endDate)}</Text>
          </View>
          <View style={styles.coverMetaRow}>
            <Text style={styles.coverMetaLabel}>Total Budget</Text>
            <Text style={styles.coverMetaValue}>{formatCurrency(totalBudget)}</Text>
          </View>
          {preparedBy ? (
            <View style={styles.coverMetaRow}>
              <Text style={styles.coverMetaLabel}>Prepared By</Text>
              <Text style={styles.coverMetaValue}>{preparedBy}</Text>
            </View>
          ) : null}
          <View style={styles.coverMetaRow}>
            <Text style={styles.coverMetaLabel}>Generated</Text>
            <Text style={styles.coverMetaValue}>{generationDate}</Text>
          </View>
          {audienceSummary ? (
            <View style={{ marginTop: 16 }}>
              <Text style={[styles.coverMetaLabel, { marginBottom: 4 }]}>Audience Strategy</Text>
              <Text style={{ fontSize: 8.5, color: '#374151', lineHeight: 1.5 }}>{audienceSummary}</Text>
            </View>
          ) : null}
        </View>
      </View>

      <View style={styles.coverFooter}>
        <Text style={styles.coverFooterText}>Insertion Order</Text>
        <Text style={styles.coverFooterText}>Confidential</Text>
      </View>
    </Page>
  )
}
