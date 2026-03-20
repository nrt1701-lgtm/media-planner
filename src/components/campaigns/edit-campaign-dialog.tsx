'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { CAMPAIGN_STATUSES, type CampaignStatus } from '@/lib/constants'

interface Campaign {
  id: string
  name: string
  status: CampaignStatus
  total_budget: number
  start_date: string
  end_date: string
  default_landing_page?: string | null
}

interface EditCampaignDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  campaign: Campaign
  onSuccess: () => void
  onDeleted?: () => void
}

function toDateInputValue(dateStr: string | null | undefined) {
  if (!dateStr) return ''
  // dateStr could be "2025-01-15T00:00:00Z" or "2025-01-15"
  return dateStr.slice(0, 10)
}

export function EditCampaignDialog({
  open,
  onOpenChange,
  campaign,
  onSuccess,
  onDeleted,
}: EditCampaignDialogProps) {
  const [name, setName] = useState(campaign.name)
  const [status, setStatus] = useState<CampaignStatus>(campaign.status)
  const [startDate, setStartDate] = useState(toDateInputValue(campaign.start_date))
  const [endDate, setEndDate] = useState(toDateInputValue(campaign.end_date))
  const [budget, setBudget] = useState(String(campaign.total_budget ?? ''))
  const [landingPage, setLandingPage] = useState(campaign.default_landing_page ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Reset form when dialog opens with new campaign data
  useEffect(() => {
    if (open) {
      setName(campaign.name)
      setStatus(campaign.status)
      setStartDate(toDateInputValue(campaign.start_date))
      setEndDate(toDateInputValue(campaign.end_date))
      setBudget(String(campaign.total_budget ?? ''))
      setLandingPage(campaign.default_landing_page ?? '')
      setError(null)
      setConfirmDelete(false)
    }
  }, [open, campaign])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const res = await fetch(`/api/campaigns/${campaign.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          status,
          start_date: startDate,
          end_date: endDate,
          total_budget: budget ? parseFloat(budget) : 0,
          default_landing_page: landingPage || undefined,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data?.error?.formErrors?.[0] ?? data?.error ?? 'Failed to update campaign')
      }

      toast.success('Campaign saved')
      onSuccess()
      onOpenChange(false)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong'
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }

    setDeleting(true)
    try {
      const res = await fetch(`/api/campaigns/${campaign.id}`, { method: 'DELETE' })

      if (!res.ok) {
        const data = await res.json()
        const msg = data?.error ?? 'Failed to delete campaign'
        setError(msg)
        toast.error(msg)
        setConfirmDelete(false)
        return
      }

      toast.success('Campaign deleted')
      onOpenChange(false)
      onDeleted?.()
    } catch {
      const msg = 'Something went wrong while deleting'
      setError(msg)
      toast.error(msg)
      setConfirmDelete(false)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Campaign</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-campaign-name">Campaign Name</Label>
            <Input
              id="edit-campaign-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Q1 Brand Awareness"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-campaign-status">Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as CampaignStatus)}>
              <SelectTrigger id="edit-campaign-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CAMPAIGN_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="edit-start-date">Start Date</Label>
              <Input
                id="edit-start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-end-date">End Date</Label>
              <Input
                id="edit-end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-budget">Total Budget ($)</Label>
            <Input
              id="edit-budget"
              type="number"
              min="0"
              step="0.01"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="0.00"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-landing-page">Default Landing Page</Label>
            <Input
              id="edit-landing-page"
              type="url"
              value={landingPage}
              onChange={(e) => setLandingPage(e.target.value)}
              placeholder="https://example.com/landing"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading || deleting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || deleting}>
              {loading ? 'Saving…' : 'Save Campaign'}
            </Button>
          </DialogFooter>
        </form>

        <Separator />

        {/* Delete zone */}
        <div className="pt-1">
          {confirmDelete ? (
            <div className="space-y-2">
              <p className="text-sm text-red-600 font-medium">
                Are you sure? This will permanently delete the campaign and all its data.
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? 'Deleting…' : 'Yes, delete'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setConfirmDelete(false)}
                  disabled={deleting}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-red-600 hover:text-red-700 hover:bg-red-50 px-0"
              onClick={handleDelete}
            >
              Delete campaign…
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
