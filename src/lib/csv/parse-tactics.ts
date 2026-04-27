import { RATE_TYPES } from '@/lib/constants'

export interface ParsedTacticRow {
  name?: string
  channel?: string
  platform?: string
  placement?: string
  flight_start?: string
  flight_end?: string
  budget?: number
  rate_type?: string
  rate?: number
  landing_page_url?: string
  audience_notes?: string
}

export interface ParsedTacticResult {
  row: number
  data: ParsedTacticRow
  errors: string[]
}

// Maps flexible CSV header names (lower-cased, trimmed) to tactic field names
const HEADER_MAP: Record<string, keyof ParsedTacticRow> = {
  name: 'name',
  channel: 'channel',
  platform: 'platform',
  placement: 'placement',
  flight_start: 'flight_start',
  'flight start': 'flight_start',
  'start date': 'flight_start',
  flight_end: 'flight_end',
  'flight end': 'flight_end',
  'end date': 'flight_end',
  budget: 'budget',
  rate_type: 'rate_type',
  'rate type': 'rate_type',
  ratetype: 'rate_type',
  rate: 'rate',
  landing_page_url: 'landing_page_url',
  'landing page url': 'landing_page_url',
  'landing page': 'landing_page_url',
  url: 'landing_page_url',
  audience_notes: 'audience_notes',
  'audience notes': 'audience_notes',
}

function parseRow(headers: string[], values: string[]): ParsedTacticRow {
  const row: ParsedTacticRow = {}
  headers.forEach((header, i) => {
    const field = HEADER_MAP[header.toLowerCase().trim()]
    if (!field) return
    const raw = (values[i] ?? '').trim()
    if (!raw) return

    if (field === 'budget' || field === 'rate') {
      const num = parseFloat(raw.replace(/[$,]/g, ''))
      if (!isNaN(num)) row[field] = num
    } else {
      (row as Record<string, string>)[field] = raw
    }
  })
  return row
}

function validateRow(data: ParsedTacticRow, rowIndex: number): string[] {
  const errs: string[] = []

  if (data.budget !== undefined && data.budget < 0) {
    errs.push('Budget must be 0 or greater')
  }

  if (data.rate !== undefined && data.rate < 0) {
    errs.push('Rate must be 0 or greater')
  }

  if (data.rate_type !== undefined && !(RATE_TYPES as readonly string[]).includes(data.rate_type)) {
    errs.push(`Invalid rate_type "${data.rate_type}" — must be one of: ${RATE_TYPES.join(', ')}`)
  }

  if (data.flight_start && isNaN(Date.parse(data.flight_start))) {
    errs.push(`Invalid flight_start date "${data.flight_start}"`)
  }

  if (data.flight_end && isNaN(Date.parse(data.flight_end))) {
    errs.push(`Invalid flight_end date "${data.flight_end}"`)
  }

  if (
    data.landing_page_url &&
    data.landing_page_url !== '' &&
    !data.landing_page_url.match(/^https?:\/\//)
  ) {
    errs.push('Landing page URL must start with http:// or https://')
  }

  void rowIndex
  return errs
}

// Splits a CSV line respecting double-quoted fields that may contain commas
function splitCsvLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += ch
    }
  }
  result.push(current)
  return result
}

export function parseTacticsCsv(text: string): {
  results: ParsedTacticResult[]
  unknownHeaders: string[]
} {
  const lines = text.split(/\r?\n/)
  const nonEmpty = lines.filter((l) => l.trim().length > 0)
  if (nonEmpty.length < 2) {
    return { results: [], unknownHeaders: [] }
  }

  const headers = splitCsvLine(nonEmpty[0]).map((h) => h.trim().replace(/^"|"$/g, ''))
  const unknownHeaders = headers.filter(
    (h) => h && !HEADER_MAP[h.toLowerCase().trim()]
  )

  const results: ParsedTacticResult[] = []
  for (let i = 1; i < nonEmpty.length; i++) {
    const values = splitCsvLine(nonEmpty[i])
    // Skip rows that are entirely empty
    if (values.every((v) => !v.trim())) continue

    const data = parseRow(headers, values)
    const errors = validateRow(data, i)
    results.push({ row: i, data, errors })
  }

  return { results, unknownHeaders }
}

export const CSV_TEMPLATE_HEADERS = [
  'name',
  'channel',
  'platform',
  'placement',
  'flight_start',
  'flight_end',
  'budget',
  'rate_type',
  'rate',
  'landing_page_url',
  'audience_notes',
]

export const CSV_TEMPLATE_EXAMPLE_ROW = [
  'Brand Awareness',
  'Programmatic Display',
  'The Trade Desk',
  'Banner 300x250',
  '2026-06-01',
  '2026-06-30',
  '10000',
  'CPM',
  '8.50',
  'https://example.com/landing',
  'Adults 25-54',
]

export function generateCsvTemplate(): string {
  return [
    CSV_TEMPLATE_HEADERS.join(','),
    CSV_TEMPLATE_EXAMPLE_ROW.join(','),
  ].join('\n')
}
