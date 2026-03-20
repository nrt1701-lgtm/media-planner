'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface IoPreviewProps {
  campaignId: string
  workamajigCode?: string
}

export function IoPreview({ campaignId, workamajigCode }: IoPreviewProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleGenerate() {
    setLoading(true)
    setError(null)

    // Revoke previous blob URL
    if (blobUrl) URL.revokeObjectURL(blobUrl)

    try {
      const res = await fetch(`/api/campaigns/${campaignId}/generate/io`, {
        method: 'POST',
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? `Request failed: ${res.status}`)
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      setBlobUrl(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate IO PDF')
    } finally {
      setLoading(false)
    }
  }

  function handleDownload() {
    if (!blobUrl) return
    const a = document.createElement('a')
    a.href = blobUrl
    a.download = `IO-${workamajigCode ?? campaignId}.pdf`
    a.click()
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Button onClick={handleGenerate} disabled={loading}>
          {loading ? 'Generating…' : 'Generate IO PDF'}
        </Button>
        {blobUrl && (
          <Button variant="outline" onClick={handleDownload}>
            Download
          </Button>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {blobUrl && (
        <iframe
          src={blobUrl}
          className="w-full rounded border"
          style={{ height: '75vh' }}
          title="IO PDF Preview"
        />
      )}
    </div>
  )
}
