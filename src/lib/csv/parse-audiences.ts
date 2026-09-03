export interface ParsedAudienceRow {
  name?: string
  age_range?: string
  gender?: string
  hhi?: string
  education?: string
  scope?: string
  markets?: string[]
  states?: string[]
  segments?: string[]
  interests?: string[]
  custom_notes?: string
}

export interface ParsedAudienceResult {
  row: number
  data: ParsedAudienceRow
  errors: string[]
}

const GENDER_VALUES = ['All', 'Male', 'Female']
const SCOPE_VALUES = ['national', 'local']

type ScalarField = 'name' | 'age_range' | 'gender' | 'hhi' | 'education' | 'scope' | 'custom_notes'
type ArrayField = 'markets' | 'states' | 'segments' | 'interests'

// Maps flexible CSV header names (lower-cased, trimmed) to audience field names
const HEADER_MAP: Record<string, ScalarField | ArrayField> = {
  name: 'name',
  'audience name': 'name',
  age_range: 'age_range',
  'age range': 'age_range',
  age: 'age_range',
  gender: 'gender',
  hhi: 'hhi',
  household_income: 'hhi',
  'household income': 'hhi',
  education: 'education',
  scope: 'scope',
  geographic_scope: 'scope',
  'geographic scope': 'scope',
  markets: 'markets',
  market: 'markets',
  states: 'states',
  state: 'states',
  segments: 'segments',
  'behavioral segments': 'segments',
  segment: 'segments',
  interests: 'interests',
  interest: 'interests',
  custom_notes: 'custom_notes',
  'custom notes': 'custom_notes',
  notes: 'custom_notes',
}

const ARRAY_FIELDS: ReadonlySet<string> = new Set<ArrayField>([
  'markets',
  'states',
  'segments',
  'interests',
])

function splitMultiValue(raw: string): string[] {
  return raw
    .split(';')
    .map((v) => v.trim())
    .filter((v) => v.length > 0)
}

function parseRow(headers: string[], values: string[]): ParsedAudienceRow {
  const row: ParsedAudienceRow = {}
  const extraNotes: string[] = []

  headers.forEach((header, i) => {
    const raw = (values[i] ?? '').trim()
    if (!raw) return

    const field = HEADER_MAP[header.toLowerCase().trim()]
    if (!field) {
      extraNotes.push(`${header.trim()}: ${raw}`)
      return
    }

    if (ARRAY_FIELDS.has(field)) {
      row[field as ArrayField] = splitMultiValue(raw)
    } else {
      row[field as ScalarField] = raw
    }
  })

  if (extraNotes.length > 0) {
    row.custom_notes = row.custom_notes
      ? `${row.custom_notes}\n${extraNotes.join('\n')}`
      : extraNotes.join('\n')
  }

  return row
}

function validateRow(data: ParsedAudienceRow): string[] {
  const errs: string[] = []

  if (data.gender !== undefined && !GENDER_VALUES.includes(data.gender)) {
    errs.push(`Invalid gender "${data.gender}" — must be one of: ${GENDER_VALUES.join(', ')}`)
  }

  if (data.scope !== undefined && !SCOPE_VALUES.includes(data.scope)) {
    errs.push(`Invalid scope "${data.scope}" — must be one of: ${SCOPE_VALUES.join(', ')}`)
  }

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

export function parseAudiencesCsv(text: string): {
  results: ParsedAudienceResult[]
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

  const results: ParsedAudienceResult[] = []
  for (let i = 1; i < nonEmpty.length; i++) {
    const values = splitCsvLine(nonEmpty[i])
    // Skip rows that are entirely empty
    if (values.every((v) => !v.trim())) continue

    const data = parseRow(headers, values)
    const errors = validateRow(data)
    results.push({ row: i, data, errors })
  }

  return { results, unknownHeaders }
}

export const CSV_TEMPLATE_HEADERS = [
  'name',
  'age_range',
  'gender',
  'hhi',
  'education',
  'scope',
  'markets',
  'states',
  'segments',
  'interests',
  'custom_notes',
]

export const CSV_TEMPLATE_EXAMPLE_ROW = [
  'Core Urban Adults',
  '25-54',
  'All',
  '$75,000+',
  'College Graduate',
  'local',
  'Chicago;New York;Los Angeles',
  'IL;NY;CA',
  'Streaming Enthusiasts;Frequent Travelers',
  'Sports;Technology',
  'Primary audience for the Q3 push',
]

function escapeCsvField(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

export function generateCsvTemplate(): string {
  return [
    CSV_TEMPLATE_HEADERS.join(','),
    CSV_TEMPLATE_EXAMPLE_ROW.map(escapeCsvField).join(','),
  ].join('\n')
}
