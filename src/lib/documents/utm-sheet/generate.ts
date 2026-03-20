import ExcelJS from 'exceljs'
import { slugify } from '@/lib/utm/slugify'
import { interpolateUtm } from '@/lib/utm/interpolate'

interface UtmTemplate {
  id: string
  client_id?: string | null
  name: string
  source_pattern: string
  medium_pattern: string
  campaign_pattern: string
  content_pattern: string
  term_pattern?: string | null
}

interface Tactic {
  id: string
  name: string
  channel?: string | null
  platform?: string | null
  placement?: string | null
  landing_page_url?: string | null
}

interface Campaign {
  name: string
  expense_number: string
  default_landing_page?: string | null
}

interface GenerateUtmSheetOptions {
  campaign: Campaign
  tactics: Tactic[]
  utmTemplates: UtmTemplate[]
  clientId?: string | null
}

const HEADER_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FF1E3A5F' },
}

const HEADER_FONT: Partial<ExcelJS.Font> = {
  bold: true,
  color: { argb: 'FFFFFFFF' },
  size: 10,
}

const ALT_ROW_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFF9FAFB' },
}

const COLUMNS: { header: string; key: string; width: number }[] = [
  { header: 'Tactic Name', key: 'tactic_name', width: 26 },
  { header: 'Channel', key: 'channel', width: 16 },
  { header: 'Platform', key: 'platform', width: 18 },
  { header: 'Landing Page URL', key: 'landing_page', width: 36 },
  { header: 'utm_source', key: 'utm_source', width: 20 },
  { header: 'utm_medium', key: 'utm_medium', width: 16 },
  { header: 'utm_campaign', key: 'utm_campaign', width: 22 },
  { header: 'utm_content', key: 'utm_content', width: 22 },
  { header: 'utm_term', key: 'utm_term', width: 18 },
  { header: 'Full UTM URL', key: 'full_url', width: 56 },
]

function applyBorders(cell: ExcelJS.Cell) {
  cell.border = {
    top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
    left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
    bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
    right: { style: 'thin', color: { argb: 'FFE5E7EB' } },
  }
}

function buildFullUrl(baseUrl: string, params: Record<string, string>): string {
  const filtered = Object.entries(params).filter(([, v]) => v !== '')
  if (filtered.length === 0) return baseUrl
  const qs = filtered.map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&')
  const separator = baseUrl.includes('?') ? '&' : '?'
  return `${baseUrl}${separator}${qs}`
}

function pickTemplate(
  templates: UtmTemplate[],
  clientId: string | null | undefined
): UtmTemplate | undefined {
  // First try client-specific template
  if (clientId) {
    const clientTemplate = templates.find(t => t.client_id === clientId)
    if (clientTemplate) return clientTemplate
  }
  // Fall back to global (no client_id)
  return templates.find(t => !t.client_id) ?? templates[0]
}

export async function generateUtmSheetExcel({
  campaign,
  tactics,
  utmTemplates,
  clientId,
}: GenerateUtmSheetOptions): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Media Planner'
  workbook.created = new Date()

  const ws = workbook.addWorksheet('UTM Parameters', {
    views: [{ state: 'frozen', ySplit: 1 }],
  })

  ws.columns = COLUMNS

  // Header row styling
  const headerRow = ws.getRow(1)
  headerRow.eachCell((cell) => {
    cell.fill = HEADER_FILL
    cell.font = HEADER_FONT
    cell.alignment = { vertical: 'middle', wrapText: false }
  })
  headerRow.height = 22

  const template = pickTemplate(utmTemplates, clientId)
  const campaignSlug = slugify(campaign.name)
  const workamajigCode = slugify(campaign.expense_number)

  let rowIdx = 2

  for (const tactic of tactics) {
    const isAlt = (rowIdx % 2) === 0

    const channel = tactic.channel ?? ''
    const platform = tactic.platform ?? ''
    const placement = tactic.placement ?? ''

    const variables: Record<string, string> = {
      platform: slugify(platform),
      channel_slug: slugify(channel),
      workamajig_code: workamajigCode,
      campaign_slug: campaignSlug,
      format: '',
      placement_slug: slugify(placement),
      tactic_slug: slugify(tactic.name),
    }

    const utmSource = template ? interpolateUtm(template.source_pattern, variables).toLowerCase() : ''
    const utmMedium = template ? interpolateUtm(template.medium_pattern, variables).toLowerCase() : ''
    const utmCampaign = template ? interpolateUtm(template.campaign_pattern, variables).toLowerCase() : ''
    const utmContent = template ? interpolateUtm(template.content_pattern, variables).toLowerCase() : ''
    const utmTerm = template?.term_pattern ? interpolateUtm(template.term_pattern, variables).toLowerCase() : ''

    const landingPage = tactic.landing_page_url || campaign.default_landing_page || ''

    const utmParams: Record<string, string> = {}
    if (utmSource) utmParams['utm_source'] = utmSource
    if (utmMedium) utmParams['utm_medium'] = utmMedium
    if (utmCampaign) utmParams['utm_campaign'] = utmCampaign
    if (utmContent) utmParams['utm_content'] = utmContent
    if (utmTerm) utmParams['utm_term'] = utmTerm

    const fullUrl = landingPage ? buildFullUrl(landingPage, utmParams) : ''

    const row = ws.getRow(rowIdx)
    row.values = [
      tactic.name || '(Unnamed)',
      channel,
      platform,
      landingPage,
      utmSource,
      utmMedium,
      utmCampaign,
      utmContent,
      utmTerm,
      fullUrl,
    ]

    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      if (colNumber <= COLUMNS.length) {
        if (isAlt) cell.fill = ALT_ROW_FILL
        cell.alignment = { vertical: 'top', wrapText: colNumber === COLUMNS.length }
        applyBorders(cell)
        // Make full URL a hyperlink if valid
        if (colNumber === COLUMNS.length && fullUrl.startsWith('http')) {
          cell.value = { text: fullUrl, hyperlink: fullUrl }
          cell.font = { color: { argb: 'FF2563EB' }, underline: true }
        }
      }
    })
    row.height = 18
    rowIdx++
  }

  const arrayBuffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(arrayBuffer)
}
