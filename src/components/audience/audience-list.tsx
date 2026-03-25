'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import useSWR from 'swr'
import { fetcher } from '@/lib/fetcher'
import { toast } from 'sonner'
import { useAudiences } from '@/hooks/use-audiences'
import { AudienceCard } from './audience-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { PlusIcon } from 'lucide-react'

interface MediaPlan {
  notes?: string | null
  prepared_by?: string | null
}

interface AudienceListProps {
  campaignId: string
}

export function AudienceList({ campaignId }: AudienceListProps) {
  const { audiences, mutate } = useAudiences(campaignId)
  const { data: mediaPlan, mutate: mutatePlan } = useSWR<MediaPlan>(
    `/api/campaigns/${campaignId}/media-plan`,
    fetcher
  )

  const [notes, setNotes] = useState('')
  const [preparedBy, setPreparedBy] = useState('')
  const [planSaveStatus, setPlanSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [adding, setAdding] = useState(false)
  const initialized = useRef(false)
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (mediaPlan && !initialized.current) {
      initialized.current = true
      setNotes(mediaPlan.notes ?? '')
      setPreparedBy(mediaPlan.prepared_by ?? '')
    }
  }, [mediaPlan])

  const savePlan = useCallback(
    async (notesData: string, preparedByData: string) => {
      setPlanSaveStatus('saving')
      try {
        const res = await fetch(`/api/campaigns/${campaignId}/media-plan`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notes: notesData || null, prepared_by: preparedByData || null }),
        })
        if (!res.ok) throw new Error('Save failed')
        const updated = await res.json()
        mutatePlan(updated, false)
        setPlanSaveStatus('saved')
        setTimeout(() => setPlanSaveStatus('idle'), 2000)
      } catch {
        setPlanSaveStatus('error')
        setTimeout(() => setPlanSaveStatus('idle'), 3000)
      }
    },
    [campaignId, mutatePlan]
  )

  function schedulePlanSave(n: string, p: string) {
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => savePlan(n, p), 800)
  }

  async function handleAddAudience() {
    setAdding(true)
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/audiences`, { method: 'POST' })
      if (!res.ok) throw new Error('Failed to create audience')
      const created = await res.json()
      await mutate([...audiences, created])
    } catch {
      toast.error('Failed to add audience')
    } finally {
      setAdding(false)
    }
  }

  async function handleDeleteAudience(id: string) {
    const res = await fetch(`/api/campaigns/${campaignId}/audiences/${id}`, { method: 'DELETE' })
    if (res.ok || res.status === 204) {
      await mutate(audiences.filter((a) => a.id !== id))
    } else {
      toast.error('Failed to delete audience')
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Audience Strategy</h2>
        <span className="text-xs text-muted-foreground">
          {planSaveStatus === 'saving' && 'Saving...'}
          {planSaveStatus === 'saved' && 'Saved'}
          {planSaveStatus === 'error' && 'Error saving'}
        </span>
      </div>

      {/* Plan Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">Plan Details</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="prepared_by">Prepared By</Label>
            <Input
              id="prepared_by"
              value={preparedBy}
              onChange={(e) => { setPreparedBy(e.target.value); schedulePlanSave(notes, e.target.value) }}
              placeholder="Your name"
            />
          </div>
          <div className="space-y-1.5 col-span-2">
            <Label htmlFor="plan_notes">Plan Notes</Label>
            <Textarea
              id="plan_notes"
              value={notes}
              onChange={(e) => { setNotes(e.target.value); schedulePlanSave(e.target.value, preparedBy) }}
              placeholder="General notes about this media plan..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Audiences */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Target Audiences</h3>
          <Button
            size="sm"
            onClick={handleAddAudience}
            disabled={adding}
            className="gap-1.5"
          >
            <PlusIcon className="size-4" />
            {adding ? 'Adding...' : 'Add Audience'}
          </Button>
        </div>

        {audiences.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border py-12 text-center">
            <p className="text-sm text-muted-foreground mb-3">
              No audiences yet — define your target segments to assign them to individual tactics.
            </p>
            <Button size="sm" variant="outline" onClick={handleAddAudience} disabled={adding} className="gap-1.5">
              <PlusIcon className="size-4" />
              Add Audience
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {audiences.map((audience, index) => (
              <AudienceCard
                key={audience.id}
                audience={audience}
                campaignId={campaignId}
                defaultExpanded={index === audiences.length - 1}
                onSaved={() => mutate()}
                onDelete={() => handleDeleteAudience(audience.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
