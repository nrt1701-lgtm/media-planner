'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import useSWR from 'swr'
import { fetcher } from '@/lib/fetcher'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { XIcon } from 'lucide-react'

interface AudienceStrategy {
  demographics: {
    age_range: string
    gender: string
    hhi: string
    education: string
  }
  geographic: {
    scope: 'national' | 'local'
    markets: string[]
    states: string[]
  }
  behavioral: {
    segments: string[]
    interests: string[]
  }
  custom_notes: string
}

interface MediaPlan {
  audience_strategy?: AudienceStrategy | null
  notes?: string | null
  prepared_by?: string | null
}

const defaultAudienceStrategy: AudienceStrategy = {
  demographics: { age_range: '', gender: '', hhi: '', education: '' },
  geographic: { scope: 'national', markets: [], states: [] },
  behavioral: { segments: [], interests: [] },
  custom_notes: '',
}

// Tag input component
function TagInput({
  tags,
  onChange,
  placeholder,
}: {
  tags: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
}) {
  const [inputValue, setInputValue] = useState('')

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault()
      const trimmed = inputValue.trim()
      if (!tags.includes(trimmed)) {
        onChange([...tags, trimmed])
      }
      setInputValue('')
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      onChange(tags.slice(0, -1))
    }
  }

  function removeTag(tag: string) {
    onChange(tags.filter((t) => t !== tag))
  }

  return (
    <div className="flex flex-wrap gap-1.5 min-h-9 border border-input rounded-md px-3 py-2 bg-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-0 focus-within:border-ring">
      {tags.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 bg-muted text-foreground text-xs font-medium px-2 py-0.5 rounded-md"
        >
          {tag}
          <button
            type="button"
            onClick={() => removeTag(tag)}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label={`Remove ${tag}`}
          >
            <XIcon className="size-3" />
          </button>
        </span>
      ))}
      <input
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={tags.length === 0 ? placeholder : ''}
        className="flex-1 min-w-[120px] bg-transparent text-sm outline-none placeholder:text-muted-foreground"
      />
    </div>
  )
}

interface AudienceFormProps {
  campaignId: string
}

export function AudienceForm({ campaignId }: AudienceFormProps) {
  const { data: mediaPlan, mutate } = useSWR<MediaPlan>(
    `/api/campaigns/${campaignId}/media-plan`,
    fetcher
  )

  const [audience, setAudience] = useState<AudienceStrategy>(defaultAudienceStrategy)
  const [notes, setNotes] = useState('')
  const [preparedBy, setPreparedBy] = useState('')
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const initialized = useRef(false)
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Initialize form from server data once
  useEffect(() => {
    if (mediaPlan && !initialized.current) {
      initialized.current = true
      if (mediaPlan.audience_strategy) {
        setAudience({
          ...defaultAudienceStrategy,
          ...mediaPlan.audience_strategy,
          demographics: {
            ...defaultAudienceStrategy.demographics,
            ...mediaPlan.audience_strategy.demographics,
          },
          geographic: {
            ...defaultAudienceStrategy.geographic,
            ...mediaPlan.audience_strategy.geographic,
          },
          behavioral: {
            ...defaultAudienceStrategy.behavioral,
            ...mediaPlan.audience_strategy.behavioral,
          },
        })
      }
      setNotes(mediaPlan.notes ?? '')
      setPreparedBy(mediaPlan.prepared_by ?? '')
    }
  }, [mediaPlan])

  const save = useCallback(
    async (audienceData: AudienceStrategy, notesData: string, preparedByData: string) => {
      setSaveStatus('saving')
      try {
        const res = await fetch(`/api/campaigns/${campaignId}/media-plan`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            audience_strategy: audienceData,
            notes: notesData || null,
            prepared_by: preparedByData || null,
          }),
        })
        if (!res.ok) throw new Error('Save failed')
        const updated = await res.json()
        mutate(updated, false)
        setSaveStatus('saved')
        setTimeout(() => setSaveStatus('idle'), 2000)
      } catch {
        setSaveStatus('error')
        setTimeout(() => setSaveStatus('idle'), 3000)
      }
    },
    [campaignId, mutate]
  )

  // Debounced auto-save
  function scheduleAutoSave(
    nextAudience: AudienceStrategy,
    nextNotes: string,
    nextPreparedBy: string
  ) {
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => {
      save(nextAudience, nextNotes, nextPreparedBy)
    }, 800)
  }

  function updateDemographics(field: keyof AudienceStrategy['demographics'], value: string) {
    const next = {
      ...audience,
      demographics: { ...audience.demographics, [field]: value },
    }
    setAudience(next)
    scheduleAutoSave(next, notes, preparedBy)
  }

  function updateGeographic(
    field: keyof AudienceStrategy['geographic'],
    value: string | string[]
  ) {
    const next = {
      ...audience,
      geographic: { ...audience.geographic, [field]: value },
    }
    setAudience(next)
    scheduleAutoSave(next, notes, preparedBy)
  }

  function updateBehavioral(field: keyof AudienceStrategy['behavioral'], value: string[]) {
    const next = {
      ...audience,
      behavioral: { ...audience.behavioral, [field]: value },
    }
    setAudience(next)
    scheduleAutoSave(next, notes, preparedBy)
  }

  function updateCustomNotes(value: string) {
    const next = { ...audience, custom_notes: value }
    setAudience(next)
    scheduleAutoSave(next, notes, preparedBy)
  }

  function updateNotes(value: string) {
    setNotes(value)
    scheduleAutoSave(audience, value, preparedBy)
  }

  function updatePreparedBy(value: string) {
    setPreparedBy(value)
    scheduleAutoSave(audience, notes, value)
  }

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      {/* Save status */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Audience Strategy</h2>
        <span className="text-xs text-muted-foreground">
          {saveStatus === 'saving' && 'Saving...'}
          {saveStatus === 'saved' && 'Saved'}
          {saveStatus === 'error' && 'Error saving'}
        </span>
      </div>

      {/* Plan metadata */}
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
              onChange={(e) => updatePreparedBy(e.target.value)}
              placeholder="Your name"
            />
          </div>
          <div className="space-y-1.5 col-span-2">
            <Label htmlFor="plan_notes">Plan Notes</Label>
            <Textarea
              id="plan_notes"
              value={notes}
              onChange={(e) => updateNotes(e.target.value)}
              placeholder="General notes about this media plan..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Demographics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">Demographics</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="age_range">Age Range</Label>
            <Input
              id="age_range"
              value={audience.demographics.age_range}
              onChange={(e) => updateDemographics('age_range', e.target.value)}
              placeholder="e.g. 25-54"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="gender">Gender</Label>
            <Select
              value={audience.demographics.gender || 'All'}
              onValueChange={(value) => updateDemographics('gender', value === 'All' ? '' : value)}
            >
              <SelectTrigger id="gender">
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All</SelectItem>
                <SelectItem value="Male">Male</SelectItem>
                <SelectItem value="Female">Female</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="hhi">Household Income (HHI)</Label>
            <Input
              id="hhi"
              value={audience.demographics.hhi}
              onChange={(e) => updateDemographics('hhi', e.target.value)}
              placeholder="e.g. $75,000+"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="education">Education</Label>
            <Input
              id="education"
              value={audience.demographics.education}
              onChange={(e) => updateDemographics('education', e.target.value)}
              placeholder="e.g. College Graduate"
            />
          </div>
        </CardContent>
      </Card>

      {/* Geographic */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">Geographic Targeting</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Scope</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={audience.geographic.scope === 'national' ? 'default' : 'outline'}
                size="sm"
                onClick={() => updateGeographic('scope', 'national')}
              >
                National
              </Button>
              <Button
                type="button"
                variant={audience.geographic.scope === 'local' ? 'default' : 'outline'}
                size="sm"
                onClick={() => updateGeographic('scope', 'local')}
              >
                Local
              </Button>
            </div>
          </div>
          {audience.geographic.scope === 'local' && (
            <>
              <div className="space-y-1.5">
                <Label>Markets</Label>
                <TagInput
                  tags={audience.geographic.markets}
                  onChange={(tags) => updateGeographic('markets', tags)}
                  placeholder="Type a market and press Enter..."
                />
                <p className="text-xs text-muted-foreground">Press Enter to add a market</p>
              </div>
              <div className="space-y-1.5">
                <Label>States</Label>
                <TagInput
                  tags={audience.geographic.states}
                  onChange={(tags) => updateGeographic('states', tags)}
                  placeholder="Type a state and press Enter..."
                />
                <p className="text-xs text-muted-foreground">Press Enter to add a state</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Behavioral */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">Behavioral Targeting</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Segments</Label>
            <TagInput
              tags={audience.behavioral.segments}
              onChange={(tags) => updateBehavioral('segments', tags)}
              placeholder="Type a segment and press Enter..."
            />
            <p className="text-xs text-muted-foreground">Press Enter to add a segment</p>
          </div>
          <div className="space-y-1.5">
            <Label>Interests</Label>
            <TagInput
              tags={audience.behavioral.interests}
              onChange={(tags) => updateBehavioral('interests', tags)}
              placeholder="Type an interest and press Enter..."
            />
            <p className="text-xs text-muted-foreground">Press Enter to add an interest</p>
          </div>
        </CardContent>
      </Card>

      {/* Custom Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">Custom Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={audience.custom_notes}
            onChange={(e) => updateCustomNotes(e.target.value)}
            placeholder="Additional notes about the target audience..."
            rows={4}
          />
        </CardContent>
      </Card>
    </div>
  )
}
