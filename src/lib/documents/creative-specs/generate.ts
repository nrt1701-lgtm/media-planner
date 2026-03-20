import ExcelJS from 'exceljs'
import { subtractBusinessDays } from './business-days'
import { format } from 'date-fns'

interface AdSpec {
  id: string
  platform: string
  placement: string
  format_name: string
  dimensions?: string | null
  file_types: string[]
  max_file_size?: string | null
  duration_limits?: string | null
  char_limits?: Record<string, number> | null
}

interface Tactic {
  id: string
  name: string
  channel?: string | null
  platform?: string | null
  placement?: string | null
  flight_start?: string | null
  ad_spec_ids: string[]
}

interface GenerateCreativeSpecsOptions {
  tactics: Tactic[]
  adSpecs: AdSpec[]
  creativLeadTimeDays: number
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

const CHANNEL_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFDBEAFE' },
}

const CHANNEL_FONT: Partial<ExcelJS.Font> = {
  bold: true,
  color: { argb: 'FF1E3A5F' },
  size: 10,
}

const ALT_ROW_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFF9FAFB' },
}

const COLUMNS = [
  { header: 'Tactic Name', key: 'tactic_name', width: 28 },
  { header: 'Platform', key: 'platform', width: 18 },
  { header: 'Placement', key: 'placement', width: 22 },
  { header: 'Format', key: 'format_name', width: 20 },
  { header: 'Dimensions', key: 'dimensions', width: 18 },
  { header: 'File Formats', key: 'file_types', width: 20 },
  { header: 'Max File Size', key: 'max_file_size', width: 14 },
  { header: 'Duration Limits', key: 'duration_limits', width: 16 },
  { header: 'Character Limits', key: 'char_limits', width: 22 },
  { header: 'Creative Due Date', key: 'creative_due_date', width: 18 },
]

function formatCharLimits(charLimits: Record<string, number> | null | undefined): string {
  if (!charLimits) return ''
  return Object.entries(charLimits)
    .map(([k, v]) => `${k}: ${v}`)
    .join(', ')
}

function applyHeaderRow(ws: ExcelJS.Worksheet) {
  ws.columns = COLUMNS
  const headerRow = ws.getRow(1)
  headerRow.eachCell((cell) => {
    cell.fill = HEADER_FILL
    cell.font = HEADER_FONT
    cell.alignment = { vertical: 'middle', wrapText: true }
  })
  headerRow.height = 22
}

function applyBorders(cell: ExcelJS.Cell) {
  cell.border = {
    top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
    left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
    bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
    right: { style: 'thin', color: { argb: 'FFE5E7EB' } },
  }
}

export async function generateCreativeSpecsExcel({
  tactics,
  adSpecs,
  creativLeadTimeDays,
}: GenerateCreativeSpecsOptions): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Media Planner'
  workbook.created = new Date()

  // Build a lookup map for ad specs
  const specById = new Map<string, AdSpec>(adSpecs.map(s => [s.id, s]))

  // Group tactics by channel
  const channelMap = new Map<string, Tactic[]>()
  for (const tactic of tactics) {
    const ch = tactic.channel || 'Unassigned'
    if (!channelMap.has(ch)) channelMap.set(ch, [])
    channelMap.get(ch)!.push(tactic)
  }

  // Summary worksheet — all unique creative assets
  const summaryWs = workbook.addWorksheet('Summary', {
    views: [{ state: 'frozen', ySplit: 1 }],
  })
  applyHeaderRow(summaryWs)

  // Track unique assets for summary (deduplicated by dimensions + file_types)
  const seenAssets = new Set<string>()
  const summaryRows: Record<string, string>[] = []

  let summaryRowIdx = 2

  // One worksheet per channel
  for (const [channel, channelTactics] of channelMap) {
    const safeSheetName = channel.slice(0, 31).replace(/[\\/*?[\]:]/g, '_')
    const ws = workbook.addWorksheet(safeSheetName, {
      views: [{ state: 'frozen', ySplit: 1 }],
    })
    applyHeaderRow(ws)

    let rowIdx = 2

    // Channel header row (spanning the whole row visually)
    const chRow = ws.getRow(rowIdx)
    chRow.getCell(1).value = channel
    chRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      if (colNumber <= COLUMNS.length) {
        cell.fill = CHANNEL_FILL
        cell.font = CHANNEL_FONT
        applyBorders(cell)
      }
    })
    chRow.height = 20
    rowIdx++

    for (const tactic of channelTactics) {
      const flightStart = tactic.flight_start ? new Date(tactic.flight_start) : null
      const creativeDueDate = flightStart
        ? format(subtractBusinessDays(flightStart, creativLeadTimeDays), 'M/d/yyyy')
        : ''

      const tacticSpecs: AdSpec[] = tactic.ad_spec_ids
        .map(id => specById.get(id))
        .filter((s): s is AdSpec => s !== undefined)

      if (tacticSpecs.length === 0) {
        // Still add a row for the tactic even if no specs assigned
        const row = ws.getRow(rowIdx)
        const isAlt = (rowIdx % 2) === 0
        const rowData = {
          tactic_name: tactic.name || '(Unnamed)',
          platform: tactic.platform ?? '',
          placement: tactic.placement ?? '',
          format_name: '',
          dimensions: '',
          file_types: '',
          max_file_size: '',
          duration_limits: '',
          char_limits: '',
          creative_due_date: creativeDueDate,
        }
        row.values = [
          rowData.tactic_name, rowData.platform, rowData.placement, rowData.format_name,
          rowData.dimensions, rowData.file_types, rowData.max_file_size,
          rowData.duration_limits, rowData.char_limits, rowData.creative_due_date,
        ]
        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
          if (colNumber <= COLUMNS.length) {
            if (isAlt) cell.fill = ALT_ROW_FILL
            cell.alignment = { vertical: 'top', wrapText: true }
            applyBorders(cell)
          }
        })
        row.height = 18
        rowIdx++
      } else {
        for (const spec of tacticSpecs) {
          const isAlt = (rowIdx % 2) === 0
          const fileTypesStr = spec.file_types.join(', ')
          const charLimitsStr = formatCharLimits(spec.char_limits)

          const row = ws.getRow(rowIdx)
          row.values = [
            tactic.name || '(Unnamed)',
            spec.platform,
            spec.placement,
            spec.format_name,
            spec.dimensions ?? '',
            fileTypesStr,
            spec.max_file_size ?? '',
            spec.duration_limits ?? '',
            charLimitsStr,
            creativeDueDate,
          ]
          row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
            if (colNumber <= COLUMNS.length) {
              if (isAlt) cell.fill = ALT_ROW_FILL
              cell.alignment = { vertical: 'top', wrapText: true }
              applyBorders(cell)
            }
          })
          row.height = 18
          rowIdx++

          // Add to summary if unique
          const assetKey = `${spec.dimensions ?? ''}|${fileTypesStr}`
          if (!seenAssets.has(assetKey)) {
            seenAssets.add(assetKey)
            summaryRows.push({
              tactic_name: tactic.name || '(Unnamed)',
              platform: spec.platform,
              placement: spec.placement,
              format_name: spec.format_name,
              dimensions: spec.dimensions ?? '',
              file_types: fileTypesStr,
              max_file_size: spec.max_file_size ?? '',
              duration_limits: spec.duration_limits ?? '',
              char_limits: charLimitsStr,
              creative_due_date: creativeDueDate,
            })
          }
        }
      }
    }
  }

  // Populate summary sheet
  for (const [i, rowData] of summaryRows.entries()) {
    const isAlt = i % 2 === 1
    const row = summaryWs.getRow(summaryRowIdx)
    row.values = [
      rowData.tactic_name, rowData.platform, rowData.placement, rowData.format_name,
      rowData.dimensions, rowData.file_types, rowData.max_file_size,
      rowData.duration_limits, rowData.char_limits, rowData.creative_due_date,
    ]
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      if (colNumber <= COLUMNS.length) {
        if (isAlt) cell.fill = ALT_ROW_FILL
        cell.alignment = { vertical: 'top', wrapText: true }
        applyBorders(cell)
      }
    })
    row.height = 18
    summaryRowIdx++
  }

  const arrayBuffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(arrayBuffer)
}
