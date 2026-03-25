'use client'

import { useState, useRef, useCallback } from 'react'
import { toast } from 'sonner'
import type { Audience, AudienceStrategy } from '@/hooks/use-audiences'
import { Card, CardContent } from '@/components/ui/card'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ChevronDownIcon, ChevronRightIcon, MoreHorizontalIcon, Trash2Icon, XIcon } from 'lucide-react'

const defaultStrategy: AudienceStrategy = {
  demographics: { age_range: '', gender: '', hhi: '', education: '' },
  geographic: { scope: 'national', markets: [], states: [] },
  behavioral: { segments: [], interests: [] },
  custom_notes: '',
}

function TagInput({ tags, onChange, placeholder }: { tags: string[]; onChange: (t: string[]) => void; placeholder?: string }) {
  const [inputValue, setInputValue] = useState('')
  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault()
      const trimmed = inputValue.trim()
      if (!tags.includes(trimmed)) onChange([...tags, trimmed])
      setInputValue('')
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      onChange(tags.slice(0, -1))
    }
  }
  return (
    <div className="flex flex-wrap gap-1.5 min-h-9 border border-input rounded-md px-3 py-2 bg-background focus-within:ring-2 focus-within:ring-ring focus-within:border-ring">
      {tags.map((tag) => (
        <span key={tag} className="inline-flex items-center gap-1 bg-muted text-foreground text-xs font-medium px-2 py-0.5 rounded-md">
          {tag}
          <button type="button" onClick={() => onChange(tags.filter((t) => t !== tag))} className="text-muted-foreground hover:text-foreground transition-colors" aria-label={`Remove ${tag}`}>
            <XIcon className="size-3" />
          </button>
        </span>
      ))}
      <input value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyDown={handleKeyDown} placeholder={tags.length === 0 ? placeholder : ''} className="flex-1 min-w-[120px] bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
    </div>
  )
}

interface AudienceCardProps {
  audience: Audience
  campaignId: string
  defaultExpanded?: boolean
  onSaved: () => void
  onDelete: () => void
}

export function AudienceCard({ audience, campaignId, defaultExpanded = false, onSaved, onDelete }: AudienceCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const [name, setName] = useState(audience.name)
  const [strategy, setStrategy] = useState<AudienceStrategy>({
    ...defaultStrategy,
    ...audience.audience_strategy,
    demographics: { ...defaultStrategy.demographics, ...(audience.audience_strategy?.demographics ?? {}) },
    geographic: { ...defaultStrategy.geographic, ...(audience.audience_strategy?.geographic ?? {}) },
    behavioral: { ...defaultStrategy.behavioral, ...(audience.audience_strategy?.behavioral ?? {}) },
  })
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const save = useCallback(async (nameData: string, strategyData: AudienceStrategy) => {
    setSaveStatus('saving')
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/audiences/${audience.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: nameData, audience_strategy: strategyData }),
      })
      if (!res.ok) throw new Error('Save failed')
      onSaved()
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 2000)
    } catch {
      setSaveStatus('error')
      toast.error('Failed to save audience')
      setTimeout(() => setSaveStatus('idle'), 3000)
    }
  }, [campaignId, audience.id, onSaved])

  function scheduleSave(n: string, s: AudienceStrategy) {
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => save(n, s), 800)
  }

  function updateDemographics(field: keyof AudienceStrategy['demographics'], value: string) {
    const next = { ...strategy, demographics: { ...strategy.demographics, [field]: value } }
    setStrategy(next)
    scheduleSave(name, next)
  }

  function updateGeographic(field: keyof AudienceStrategy['geographic'], value: string | string[]) {
    const next = { ...strategy, geographic: { ...strategy.geographic, [field]: value } }
    setStrategy(next)
    scheduleSave(name, next)
  }

  function updateBehavioral(field: keyof AudienceStrategy['behavioral'], value: string[]) {
    const next = { ...strategy, behavioral: { ...strategy.behavioral, [field]: value } }
    setStrategy(next)
    scheduleSave(name, next)
  }

  function updateCustomNotes(value: string) {
    const next = { ...strategy, custom_notes: value }
    setStrategy(next)
    scheduleSave(name, next)
  }

  function handleNameBlur() {
    scheduleSave(name, strategy)
  }

  return (
    <Card className="overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 bg-muted/40 border-b border-border">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-2 flex-1 text-left hover:text-foreground transition-colors"
        >
          {expanded
            ? <ChevronDownIcon className="size-4 text-muted-foreground shrink-0" />
            : <ChevronRightIcon className="size-4 text-muted-foreground shrink-0" />}
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={handleNameBlur}
            onClick={(e) => e.stopPropagation()}
            placeholder="Audience name"
            className="h-7 border-transparent bg-transparent shadow-none font-medium text-sm focus-visible:ring-1 focus-visible:ring-brand-teal/40 focus-visible:border-brand-teal/40"
          />
        </button>
        <span className="text-xs text-muted-foreground shrink-0">
          {saveStatus === 'saving' && 'Saving...'}
          {saveStatus === 'saved' && 'Saved'}
          {saveStatus === 'error' && 'Error'}
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 shrink-0">
              <MoreHorizontalIcon className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onDelete} className="text-red-600 focus:text-red-600 focus:bg-red-50">
              <Trash2Icon className="size-4 mr-2" />
              Delete audience
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Body */}
      {expanded && (
        <CardContent className="p-4 space-y-6">
          {/* Demographics */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Demographics</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor={`age-${audience.id}`}>Age Range</Label>
                <Input id={`age-${audience.id}`} value={strategy.demographics.age_range} onChange={(e) => updateDemographics('age_range', e.target.value)} placeholder="e.g. 25-54" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`gender-${audience.id}`}>Gender</Label>
                <Select value={strategy.demographics.gender || 'All'} onValueChange={(v) => updateDemographics('gender', v === 'All' ? '' : v)}>
                  <SelectTrigger id={`gender-${audience.id}`}><SelectValue placeholder="Select gender" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All</SelectItem>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`hhi-${audience.id}`}>Household Income (HHI)</Label>
                <Input id={`hhi-${audience.id}`} value={strategy.demographics.hhi} onChange={(e) => updateDemographics('hhi', e.target.value)} placeholder="e.g. $75,000+" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`edu-${audience.id}`}>Education</Label>
                <Input id={`edu-${audience.id}`} value={strategy.demographics.education} onChange={(e) => updateDemographics('education', e.target.value)} placeholder="e.g. College Graduate" />
              </div>
            </div>
          </div>

          {/* Geographic */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Geographic Targeting</p>
            <div className="space-y-1.5">
              <Label>Scope</Label>
              <div className="flex gap-2">
                <Button type="button" variant={strategy.geographic.scope === 'national' ? 'default' : 'outline'} size="sm" onClick={() => updateGeographic('scope', 'national')}>National</Button>
                <Button type="button" variant={strategy.geographic.scope === 'local' ? 'default' : 'outline'} size="sm" onClick={() => updateGeographic('scope', 'local')}>Local</Button>
              </div>
            </div>
            {strategy.geographic.scope === 'local' && (
              <>
                <div className="space-y-1.5">
                  <Label>Markets</Label>
                  <TagInput tags={strategy.geographic.markets} onChange={(tags) => updateGeographic('markets', tags)} placeholder="Type a market and press Enter..." />
                  <p className="text-xs text-muted-foreground">Press Enter to add a market</p>
                </div>
                <div className="space-y-1.5">
                  <Label>States</Label>
                  <TagInput tags={strategy.geographic.states} onChange={(tags) => updateGeographic('states', tags)} placeholder="Type a state and press Enter..." />
                  <p className="text-xs text-muted-foreground">Press Enter to add a state</p>
                </div>
              </>
            )}
          </div>

          {/* Behavioral */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Behavioral Targeting</p>
            <div className="space-y-1.5">
              <Label>Segments</Label>
              <TagInput tags={strategy.behavioral.segments} onChange={(tags) => updateBehavioral('segments', tags)} placeholder="Type a segment and press Enter..." />
              <p className="text-xs text-muted-foreground">Press Enter to add a segment</p>
            </div>
            <div className="space-y-1.5">
              <Label>Interests</Label>
              <TagInput tags={strategy.behavioral.interests} onChange={(tags) => updateBehavioral('interests', tags)} placeholder="Type an interest and press Enter..." />
              <p className="text-xs text-muted-foreground">Press Enter to add an interest</p>
            </div>
          </div>

          {/* Custom Notes */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Custom Notes</p>
            <Textarea value={strategy.custom_notes} onChange={(e) => updateCustomNotes(e.target.value)} placeholder="Additional notes about this audience..." rows={3} />
          </div>
        </CardContent>
      )}
    </Card>
  )
}
