'use client'

import { useState, useRef, useCallback } from 'react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { UploadIcon } from 'lucide-react'

// Expected CSV columns (case-insensitive match)
const COLUMN_MAP: Record<string, string> = {
  platform: 'platform',
  placement: 'placement',
  format: 'format_name',
  dimensions: 'dimensions',
  'file types': 'file_types',
  'max size': 'max_file_size',
  duration: 'duration_limits',
  'char limits': 'char_limits',
  notes: 'notes',
}

interface ParsedRow {
  platform: string
  placement: string
  format_name: string
  dimensions?: string | null
  file_types: string[]
  max_file_size?: string | null
  duration_limits?: string | null
  char_limits?: Record<string, number> | null
  notes?: string | null
  _errors: string[]
}

function parseCharLimits(raw: string): Record<string, number> | null {
  if (!raw.trim()) return null
  const pairs = raw.split(',').map((s) => s.trim()).filter(Boolean)
  const result: Record<string, number> = {}
  for (const pair of pairs) {
    const [k, v] = pair.split(':').map((s) => s.trim())
    if (k && v !== undefined) {
      const num = parseInt(v, 10)
      if (!isNaN(num)) result[k] = num
    }
  }
  return Object.keys(result).length > 0 ? result : null
}

function parseCsv(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim())
  if (lines.length === 0) return { headers: [], rows: [] }

  function splitLine(line: string): string[] {
    const fields: string[] = []
    let current = ''
    let inQuotes = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') { current += '"'; i++ }
        else inQuotes = !inQuotes
      } else if (ch === ',' && !inQuotes) {
        fields.push(current)
        current = ''
      } else {
        current += ch
      }
    }
    fields.push(current)
    return fields.map((f) => f.trim())
  }

  const headers = splitLine(lines[0])
  const rows = lines.slice(1).map(splitLine)
  return { headers, rows }
}

function buildRows(headers: string[], rows: string[][]): ParsedRow[] {
  // Map header names → field keys
  const colIndex: Record<string, number> = {}
  headers.forEach((h, i) => {
    const key = COLUMN_MAP[h.toLowerCase().trim()]
    if (key) colIndex[key] = i
  })

  return rows.map((row) => {
    const get = (key: string) => {
      const idx = colIndex[key]
      return idx !== undefined ? (row[idx] ?? '').trim() : ''
    }

    const errors: string[] = []
    const platform = get('platform')
    const placement = get('placement')
    const format_name = get('format_name')

    if (!platform) errors.push('Platform required')
    if (!placement) errors.push('Placement required')
    if (!format_name) errors.push('Format required')

    const rawFileTypes = get('file_types')
    const file_types = rawFileTypes
      ? rawFileTypes.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean)
      : []

    return {
      platform,
      placement,
      format_name,
      dimensions: get('dimensions') || null,
      file_types,
      max_file_size: get('max_file_size') || null,
      duration_limits: get('duration_limits') || null,
      char_limits: parseCharLimits(get('char_limits')),
      notes: get('notes') || null,
      _errors: errors,
    }
  }).filter((r) => r.platform || r.placement || r.format_name) // skip fully empty rows
}

interface CsvImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImported: () => void
}

type Step = 'upload' | 'preview' | 'importing'

export function CsvImportDialog({ open, onOpenChange, onImported }: CsvImportDialogProps) {
  const [step, setStep] = useState<Step>('upload')
  const [rows, setRows] = useState<ParsedRow[]>([])
  const [progress, setProgress] = useState(0)
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function reset() {
    setStep('upload')
    setRows([])
    setProgress(0)
    setIsDragOver(false)
  }

  function handleOpenChange(val: boolean) {
    if (!val) reset()
    onOpenChange(val)
  }

  function processFile(file: File) {
    if (!file.name.endsWith('.csv')) {
      toast.error('Please upload a .csv file')
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const { headers, rows: rawRows } = parseCsv(text)
      if (headers.length === 0) {
        toast.error('Could not parse CSV — file appears empty')
        return
      }
      const parsed = buildRows(headers, rawRows)
      if (parsed.length === 0) {
        toast.error('No data rows found in CSV')
        return
      }
      setRows(parsed)
      setStep('preview')
    }
    reader.readAsText(file)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }, [])

  const validRows = rows.filter((r) => r._errors.length === 0)
  const invalidRows = rows.filter((r) => r._errors.length > 0)

  async function handleImport() {
    setStep('importing')
    setProgress(0)

    const BATCH = 20
    let done = 0
    let failed = 0

    for (let i = 0; i < validRows.length; i += BATCH) {
      const batch = validRows.slice(i, i + BATCH)
      const results = await Promise.all(
        batch.map(({ _errors: _e, ...spec }) =>
          fetch('/api/ad-specs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(spec),
          }).then((r) => r.ok ? 'ok' : 'fail')
        )
      )
      done += results.filter((r) => r === 'ok').length
      failed += results.filter((r) => r === 'fail').length
      setProgress(i + batch.length)
    }

    onImported()
    handleOpenChange(false)

    if (failed > 0) {
      toast.warning(`Imported ${done} spec${done !== 1 ? 's' : ''}. ${failed} failed.`)
    } else {
      toast.success(`Imported ${done} ad spec${done !== 1 ? 's' : ''} successfully`)
    }
  }

  const PREVIEW_LIMIT = 10

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Ad Specs from CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV with columns: Platform, Placement, Format, Dimensions, File Types, Max Size, Duration, Char Limits, Notes
          </DialogDescription>
        </DialogHeader>

        {step === 'upload' && (
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`mt-2 flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-12 cursor-pointer transition-colors ${
              isDragOver ? 'border-brand-teal bg-brand-teal/5' : 'border-border hover:border-brand-teal/50 hover:bg-muted/50'
            }`}
          >
            <UploadIcon className="w-8 h-8 text-muted-foreground" />
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">Drop your CSV here or click to browse</p>
              <p className="text-xs text-muted-foreground mt-1">Accepts .csv files only</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFileChange}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}

        {step === 'preview' && (
          <div className="space-y-4 mt-2">
            <div className="flex items-center gap-3 text-sm">
              <Badge variant="secondary" className="bg-brand-teal/10 text-brand-teal border-0">
                {validRows.length} valid
              </Badge>
              {invalidRows.length > 0 && (
                <Badge variant="secondary" className="bg-amber-100 text-amber-700 border-0">
                  {invalidRows.length} invalid (will be skipped)
                </Badge>
              )}
              <span className="text-muted-foreground">{rows.length} total rows found</span>
            </div>

            <div className="rounded-lg border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-muted">
                      {['Platform', 'Placement', 'Format', 'Dimensions', 'File Types', 'Max Size', 'Duration', 'Char Limits', 'Notes', 'Status'].map((h) => (
                        <th key={h} className="px-2 py-2 text-left font-semibold text-muted-foreground whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, PREVIEW_LIMIT).map((row, i) => (
                      <tr key={i} className={`border-t border-border ${row._errors.length > 0 ? 'bg-amber-50' : ''}`}>
                        <td className={`px-2 py-1.5 ${!row.platform ? 'text-amber-600 font-medium' : 'text-foreground'}`}>{row.platform || '—'}</td>
                        <td className={`px-2 py-1.5 ${!row.placement ? 'text-amber-600 font-medium' : 'text-muted-foreground'}`}>{row.placement || '—'}</td>
                        <td className={`px-2 py-1.5 ${!row.format_name ? 'text-amber-600 font-medium' : 'text-muted-foreground'}`}>{row.format_name || '—'}</td>
                        <td className="px-2 py-1.5 text-muted-foreground">{row.dimensions ?? '—'}</td>
                        <td className="px-2 py-1.5 text-muted-foreground">{row.file_types.join(', ') || '—'}</td>
                        <td className="px-2 py-1.5 text-muted-foreground">{row.max_file_size ?? '—'}</td>
                        <td className="px-2 py-1.5 text-muted-foreground">{row.duration_limits ?? '—'}</td>
                        <td className="px-2 py-1.5 text-muted-foreground">
                          {row.char_limits ? Object.entries(row.char_limits).map(([k, v]) => `${k}:${v}`).join(', ') : '—'}
                        </td>
                        <td className="px-2 py-1.5 text-muted-foreground max-w-[120px] truncate">{row.notes ?? '—'}</td>
                        <td className="px-2 py-1.5">
                          {row._errors.length > 0 ? (
                            <span className="text-amber-600" title={row._errors.join(', ')}>⚠ {row._errors[0]}</span>
                          ) : (
                            <span className="text-brand-teal">✓</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {rows.length > PREVIEW_LIMIT && (
                <div className="px-3 py-2 bg-muted text-xs text-muted-foreground border-t border-border">
                  Showing {PREVIEW_LIMIT} of {rows.length} rows
                </div>
              )}
            </div>
          </div>
        )}

        {step === 'importing' && (
          <div className="flex flex-col items-center justify-center gap-4 py-10">
            <div className="text-sm text-muted-foreground">
              Importing {Math.min(progress, validRows.length)} of {validRows.length} specs…
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-brand-teal h-2 rounded-full transition-all"
                style={{ width: `${validRows.length > 0 ? (progress / validRows.length) * 100 : 0}%` }}
              />
            </div>
          </div>
        )}

        <DialogFooter>
          {step === 'upload' && (
            <Button variant="outline" onClick={() => handleOpenChange(false)}>Cancel</Button>
          )}
          {step === 'preview' && (
            <>
              <Button variant="outline" onClick={reset}>Back</Button>
              <Button onClick={handleImport} disabled={validRows.length === 0}>
                Import {validRows.length} Spec{validRows.length !== 1 ? 's' : ''}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
