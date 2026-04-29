interface AdSpec {
  platform: string
  placement: string
  format_name: string
  dimensions?: string | null
  file_types?: string[] | null
  max_file_size?: string | null
  duration_limits?: string | null
  char_limits?: Record<string, number> | null
  notes?: string | null
}

// Headers match the COLUMN_MAP keys in csv-import-dialog.tsx for round-trip compatibility
const HEADERS = [
  'Platform',
  'Placement',
  'Format',
  'Dimensions',
  'File Types',
  'Max Size',
  'Duration',
  'Char Limits',
  'Notes',
]

function csvEscape(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

export function generateAdSpecsCsv(specs: AdSpec[]): string {
  const rows = specs.map((spec) => {
    const fileTypes = (spec.file_types ?? []).join(', ')
    const charLimits = spec.char_limits
      ? Object.entries(spec.char_limits)
          .map(([k, v]) => `${k}: ${v}`)
          .join(', ')
      : ''

    return [
      csvEscape(spec.platform),
      csvEscape(spec.placement),
      csvEscape(spec.format_name),
      csvEscape(spec.dimensions ?? ''),
      csvEscape(fileTypes),
      csvEscape(spec.max_file_size ?? ''),
      csvEscape(spec.duration_limits ?? ''),
      csvEscape(charLimits),
      csvEscape(spec.notes ?? ''),
    ].join(',')
  })

  return [HEADERS.join(','), ...rows].join('\n')
}
