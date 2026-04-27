'use client'

import { useState, useRef, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { UploadIcon, DownloadIcon, CheckCircle2Icon, AlertCircleIcon, FileTextIcon } from 'lucide-react'
import {
  parseTacticsCsv,
  generateCsvTemplate,
  type ParsedTacticResult,
} from '@/lib/csv/parse-tactics'

type Step = 'upload' | 'preview' | 'importing' | 'done'

interface CsvUploadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  campaignId: string
  onSuccess: () => void
}

export function CsvUploadDialog({
  open,
  onOpenChange,
  campaignId,
  onSuccess,
}: CsvUploadDialogProps) {
  const [step, setStep] = useState<Step>('upload')
  const [results, setResults] = useState<ParsedTacticResult[]>([])
  const [unknownHeaders, setUnknownHeaders] = useState<string[]>([])
  const [fileName, setFileName] = useState('')
  const [importedCount, setImportedCount] = useState(0)
  const [serverError, setServerError] = useState('')
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validRows = results.filter((r: ParsedTacticResult) => r.errors.length === 0)
  const invalidRows = results.filter((r: ParsedTacticResult) => r.errors.length > 0)

  function reset() {
    setStep('upload')
    setResults([])
    setUnknownHeaders([])
    setFileName('')
    setImportedCount(0)
    setServerError('')
    setDragActive(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function handleOpenChange(val: boolean) {
    if (!val) reset()
    onOpenChange(val)
  }

  function downloadTemplate() {
    const csv = generateCsvTemplate()
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'tactics-template.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  function processFile(file: File) {
    if (!file.name.endsWith('.csv')) return
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const { results: parsed, unknownHeaders: unknown } = parseTacticsCsv(text)
      setResults(parsed)
      setUnknownHeaders(unknown)
      setStep('preview')
    }
    reader.readAsText(file)
  }

  function handleFileChange(e: { target: HTMLInputElement }) {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  const handleDragOver = useCallback((e: { preventDefault: () => void }) => {
    e.preventDefault()
    setDragActive(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setDragActive(false)
  }, [])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleDrop = useCallback((e: { preventDefault: () => void; dataTransfer: DataTransfer }) => {
    e.preventDefault()
    setDragActive(false)
    const file = e.dataTransfer.files?.[0]
    if (file) processFile(file)
  }, [])

  async function handleImport() {
    if (validRows.length === 0) return
    setStep('importing')
    setServerError('')

    const tactics = validRows.map((r: ParsedTacticResult) => ({
      name: r.data.name ?? '',
      channel: r.data.channel,
      platform: r.data.platform,
      placement: r.data.placement,
      flight_start: r.data.flight_start,
      flight_end: r.data.flight_end,
      budget: r.data.budget ?? 0,
      rate_type: r.data.rate_type ?? 'CPM',
      rate: r.data.rate ?? 0,
      landing_page_url: r.data.landing_page_url ?? '',
      audience_notes: r.data.audience_notes,
      ad_spec_ids: [],
    }))

    try {
      const res = await fetch(`/api/campaigns/${campaignId}/tactics/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tactics }),
      })
      const json = await res.json()
      if (!res.ok) {
        setServerError(json.error ?? 'Import failed. Please try again.')
        setStep('preview')
        return
      }
      setImportedCount(json.created?.length ?? validRows.length)
      setStep('done')
      onSuccess()
    } catch {
      setServerError('Network error — please check your connection and try again.')
      setStep('preview')
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Import Tactics from CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV file to add multiple tactics at once.
          </DialogDescription>
        </DialogHeader>

        {/* ── Step 1: Upload ─────────────────────────────────────────────── */}
        {step === 'upload' && (
          <div className="flex flex-col gap-4 py-2">
            <div
              role="button"
              tabIndex={0}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e: { key: string }) => e.key === 'Enter' && fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={[
                'flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-10 cursor-pointer transition-colors',
                dragActive
                  ? 'border-brand-teal bg-brand-teal/5'
                  : 'border-border hover:border-brand-teal/50 hover:bg-muted/40',
              ].join(' ')}
            >
              <UploadIcon className="size-8 text-muted-foreground" />
              <div className="text-center">
                <p className="text-sm font-medium">Drop your CSV here or click to browse</p>
                <p className="text-xs text-muted-foreground mt-1">Only .csv files are accepted</p>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFileChange}
            />
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Need the right format?</span>
              <button
                type="button"
                onClick={downloadTemplate}
                className="inline-flex items-center gap-1 text-brand-teal hover:underline font-medium"
              >
                <DownloadIcon className="size-3.5" />
                Download template
              </button>
            </div>
          </div>
        )}

        {/* ── Step 2: Preview ────────────────────────────────────────────── */}
        {step === 'preview' && (
          <div className="flex flex-col gap-3 min-h-0">
            {/* Summary bar */}
            <div className="flex items-center gap-4 rounded-md bg-muted px-3 py-2 text-sm shrink-0">
              <span className="flex items-center gap-1.5 text-green-700">
                <CheckCircle2Icon className="size-4" />
                <strong>{validRows.length}</strong> row{validRows.length !== 1 ? 's' : ''} ready
              </span>
              {invalidRows.length > 0 && (
                <span className="flex items-center gap-1.5 text-red-600">
                  <AlertCircleIcon className="size-4" />
                  <strong>{invalidRows.length}</strong> row{invalidRows.length !== 1 ? 's' : ''} with errors
                  {validRows.length > 0 && ' (will be skipped)'}
                </span>
              )}
              {unknownHeaders.length > 0 && (
                <span className="text-amber-600 text-xs ml-auto">
                  Ignored columns: {unknownHeaders.join(', ')}
                </span>
              )}
            </div>

            {serverError && (
              <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                {serverError}
              </div>
            )}

            {results.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center text-muted-foreground text-sm">
                <FileTextIcon className="size-8" />
                <p>No data rows found in <strong>{fileName}</strong>.</p>
                <p>Make sure your CSV has a header row and at least one data row.</p>
              </div>
            ) : (
              /* Preview table */
              <div className="overflow-auto flex-1 rounded-md border border-border text-xs">
                <table className="min-w-full">
                  <thead className="bg-muted sticky top-0">
                    <tr>
                      <th className="px-2 py-1.5 text-left font-medium text-muted-foreground w-8">#</th>
                      <th className="px-2 py-1.5 text-left font-medium text-muted-foreground">Name</th>
                      <th className="px-2 py-1.5 text-left font-medium text-muted-foreground">Channel</th>
                      <th className="px-2 py-1.5 text-left font-medium text-muted-foreground">Platform</th>
                      <th className="px-2 py-1.5 text-left font-medium text-muted-foreground">Budget</th>
                      <th className="px-2 py-1.5 text-left font-medium text-muted-foreground">Rate Type</th>
                      <th className="px-2 py-1.5 text-left font-medium text-muted-foreground">Rate</th>
                      <th className="px-2 py-1.5 text-left font-medium text-muted-foreground">Flight Start</th>
                      <th className="px-2 py-1.5 text-left font-medium text-muted-foreground">Flight End</th>
                      <th className="px-2 py-1.5 text-left font-medium text-muted-foreground w-40">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {results.map((r: ParsedTacticResult) => {
                      const hasErrors = r.errors.length > 0
                      return (
                        <tr
                          key={r.row}
                          className={hasErrors ? 'bg-red-50' : 'hover:bg-muted/30'}
                        >
                          <td className="px-2 py-1.5 text-muted-foreground">{r.row}</td>
                          <td className="px-2 py-1.5 truncate max-w-[120px]">{r.data.name ?? '—'}</td>
                          <td className="px-2 py-1.5 truncate max-w-[100px]">{r.data.channel ?? '—'}</td>
                          <td className="px-2 py-1.5 truncate max-w-[100px]">{r.data.platform ?? '—'}</td>
                          <td className="px-2 py-1.5">
                            {r.data.budget != null ? `$${r.data.budget.toLocaleString()}` : '—'}
                          </td>
                          <td className="px-2 py-1.5">{r.data.rate_type ?? 'CPM'}</td>
                          <td className="px-2 py-1.5">
                            {r.data.rate != null ? `$${r.data.rate}` : '—'}
                          </td>
                          <td className="px-2 py-1.5">{r.data.flight_start ?? '—'}</td>
                          <td className="px-2 py-1.5">{r.data.flight_end ?? '—'}</td>
                          <td className="px-2 py-1.5">
                            {hasErrors ? (
                              <span className="text-red-600 leading-tight">
                                {r.errors.join(' · ')}
                              </span>
                            ) : (
                              <span className="text-green-700 flex items-center gap-1">
                                <CheckCircle2Icon className="size-3.5" />
                                Ready
                              </span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── Step 3: Importing ──────────────────────────────────────────── */}
        {step === 'importing' && (
          <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
            <div className="size-8 animate-spin rounded-full border-2 border-brand-teal border-t-transparent" />
            <p className="text-sm text-muted-foreground">
              Importing {validRows.length} tactic{validRows.length !== 1 ? 's' : ''}…
            </p>
          </div>
        )}

        {/* ── Step 4: Done ───────────────────────────────────────────────── */}
        {step === 'done' && (
          <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
            <CheckCircle2Icon className="size-10 text-green-600" />
            <p className="text-base font-medium">
              {importedCount} tactic{importedCount !== 1 ? 's' : ''} imported successfully
            </p>
            {invalidRows.length > 0 && (
              <p className="text-sm text-muted-foreground">
                {invalidRows.length} row{invalidRows.length !== 1 ? 's were' : ' was'} skipped due to errors.
              </p>
            )}
          </div>
        )}

        {/* ── Footer ─────────────────────────────────────────────────────── */}
        <DialogFooter className="shrink-0 pt-2">
          {step === 'upload' && (
            <Button variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
          )}

          {step === 'preview' && (
            <>
              <Button variant="outline" onClick={reset}>
                Back
              </Button>
              <Button
                onClick={handleImport}
                disabled={validRows.length === 0}
                className="bg-brand-teal hover:bg-brand-teal/90 text-white"
              >
                Import {validRows.length} tactic{validRows.length !== 1 ? 's' : ''}
              </Button>
            </>
          )}

          {step === 'done' && (
            <Button onClick={() => handleOpenChange(false)}>
              Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
