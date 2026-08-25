'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'

interface CreateClientDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function CreateClientDialog({ open, onOpenChange, onSuccess }: CreateClientDialogProps) {
  const [name, setName] = useState('')
  const [clientCode, setClientCode] = useState('')
  const [industry, setIndustry] = useState('')
  const [markupPercentage, setMarkupPercentage] = useState('0')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          client_code: clientCode,
          industry: industry || undefined,
          markup_percentage: markupPercentage === '' ? 0 : parseFloat(markupPercentage),
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data?.error?.formErrors?.[0] ?? 'Failed to create client')
      }

      setName('')
      setClientCode('')
      setIndustry('')
      setMarkupPercentage('0')
      onSuccess()
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Client</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="client-name">Client Name</Label>
            <Input
              id="client-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Acme Corporation"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="client-code">Client Code</Label>
            <Input
              id="client-code"
              value={clientCode}
              onChange={(e) => setClientCode(e.target.value.toUpperCase())}
              placeholder="ACME"
              maxLength={10}
              required
            />
            <p className="text-xs text-muted-foreground">Short code used in Workamajig (max 10 chars)</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="client-industry">Industry</Label>
            <Input
              id="client-industry"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              placeholder="Retail, Healthcare, Finance…"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="client-markup">Markup %</Label>
            <Input
              id="client-markup"
              type="number"
              min="0"
              step="0.01"
              value={markupPercentage}
              onChange={(e) => setMarkupPercentage(e.target.value)}
              placeholder="0"
            />
            <p className="text-xs text-muted-foreground">
              Applied to net media cost for client-facing totals (Insertion Orders, Gross view)
            </p>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating…' : 'Create Client'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
