'use client'

import { useState } from 'react'
import { FileText, Download, Eye, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface DocumentCardProps {
  title: string
  description: string
  downloadEndpoint: string
  fileName: string
  campaignId: string
  canPreview?: boolean
  onPreview?: () => void
}

export function DocumentCard({
  title,
  description,
  downloadEndpoint,
  fileName,
  campaignId,
  canPreview = false,
  onPreview,
}: DocumentCardProps) {
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleDownload() {
    setDownloading(true)
    setError(null)

    try {
      const res = await fetch(downloadEndpoint, { method: 'POST' })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? `Request failed: ${res.status}`)
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download failed')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-brand-teal/10 flex-shrink-0">
            <FileText className="w-5 h-5 text-brand-teal" />
          </div>
          <div className="min-w-0">
            <CardTitle className="text-sm font-semibold text-foreground">{title}</CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-0.5">{description}</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-3 pt-0">
        {error && (
          <p className="text-xs text-red-600 bg-red-50 rounded px-2 py-1">{error}</p>
        )}

        <div className="flex gap-2">
          {canPreview && onPreview && (
            <Button
              variant="outline"
              size="sm"
              onClick={onPreview}
              className="flex items-center gap-1.5"
            >
              <Eye className="w-3.5 h-3.5" />
              Preview
            </Button>
          )}
          <Button
            size="sm"
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center gap-1.5"
          >
            {downloading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            {downloading ? 'Generating…' : 'Download'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
