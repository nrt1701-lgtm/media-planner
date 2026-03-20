'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Trash2 } from 'lucide-react'

interface AdSpec {
  id?: string
  platform: string
  placement: string
  format_name: string
  dimensions?: string | null
  file_types?: string[]
  max_file_size?: string | null
  duration_limits?: string | null
  char_limits?: Record<string, number> | null
}

interface AdSpecFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  spec?: AdSpec | null
  onSaved: () => void
}

const EMPTY_SPEC: AdSpec = {
  platform: '',
  placement: '',
  format_name: '',
  dimensions: '',
  file_types: [],
  max_file_size: '',
  duration_limits: '',
  char_limits: null,
}

export function AdSpecFormDialog({ open, onOpenChange, spec, onSaved }: AdSpecFormDialogProps) {
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<AdSpec>(EMPTY_SPEC)
  const [fileTypesInput, setFileTypesInput] = useState('')
  const [charLimitPairs, setCharLimitPairs] = useState<Array<{ key: string; value: string }>>([])

  const isEdit = !!spec?.id

  useEffect(() => {
    if (spec) {
      setForm({ ...EMPTY_SPEC, ...spec })
      setFileTypesInput((spec.file_types ?? []).join(', '))
      setCharLimitPairs(
        Object.entries(spec.char_limits ?? {}).map(([key, value]) => ({
          key,
          value: String(value),
        }))
      )
    } else {
      setForm(EMPTY_SPEC)
      setFileTypesInput('')
      setCharLimitPairs([])
    }
  }, [spec, open])

  function setField<K extends keyof AdSpec>(key: K, value: AdSpec[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function addCharLimit() {
    setCharLimitPairs((prev) => [...prev, { key: '', value: '' }])
  }

  function updateCharLimit(index: number, field: 'key' | 'value', val: string) {
    setCharLimitPairs((prev) =>
      prev.map((pair, i) => (i === index ? { ...pair, [field]: val } : pair))
    )
  }

  function removeCharLimit(index: number) {
    setCharLimitPairs((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSave() {
    setSaving(true)
    try {
      const fileTypes = fileTypesInput
        .split(',')
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean)

      const charLimits = charLimitPairs.length > 0
        ? Object.fromEntries(
            charLimitPairs
              .filter((p) => p.key.trim())
              .map((p) => [p.key.trim(), parseInt(p.value, 10) || 0])
          )
        : null

      const payload = {
        ...form,
        file_types: fileTypes,
        char_limits: charLimits,
        dimensions: form.dimensions || null,
        max_file_size: form.max_file_size || null,
        duration_limits: form.duration_limits || null,
      }

      const url = isEdit ? `/api/ad-specs/${spec!.id}` : '/api/ad-specs'
      const method = isEdit ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? 'Failed to save ad spec')
      }

      toast.success(isEdit ? 'Ad spec updated' : 'Ad spec created')
      onSaved()
      onOpenChange(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save ad spec')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Ad Spec' : 'Add Ad Spec'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="platform">Platform *</Label>
              <Input
                id="platform"
                placeholder="e.g. Meta"
                value={form.platform}
                onChange={(e) => setField('platform', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="placement">Placement *</Label>
              <Input
                id="placement"
                placeholder="e.g. Feed"
                value={form.placement}
                onChange={(e) => setField('placement', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="format-name">Format Name *</Label>
            <Input
              id="format-name"
              placeholder="e.g. Single Image"
              value={form.format_name}
              onChange={(e) => setField('format_name', e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="dimensions">Dimensions</Label>
            <Input
              id="dimensions"
              placeholder="e.g. 1080x1080"
              value={form.dimensions ?? ''}
              onChange={(e) => setField('dimensions', e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="file-types">File Types</Label>
            <Input
              id="file-types"
              placeholder="e.g. jpg, png, mp4"
              value={fileTypesInput}
              onChange={(e) => setFileTypesInput(e.target.value)}
            />
            <p className="text-xs text-gray-500">Comma-separated list of accepted file types.</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="max-size">Max File Size</Label>
              <Input
                id="max-size"
                placeholder="e.g. 30MB"
                value={form.max_file_size ?? ''}
                onChange={(e) => setField('max_file_size', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="duration">Duration Limits</Label>
              <Input
                id="duration"
                placeholder="e.g. 15s max"
                value={form.duration_limits ?? ''}
                onChange={(e) => setField('duration_limits', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Character Limits</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={addCharLimit}
                className="h-7 text-xs"
              >
                <Plus className="w-3 h-3 mr-1" />
                Add
              </Button>
            </div>
            {charLimitPairs.length === 0 && (
              <p className="text-xs text-gray-400">No character limits defined.</p>
            )}
            {charLimitPairs.map((pair, i) => (
              <div key={i} className="flex gap-2 items-center">
                <Input
                  placeholder="Field (e.g. Headline)"
                  value={pair.key}
                  onChange={(e) => updateCharLimit(i, 'key', e.target.value)}
                  className="flex-1"
                />
                <Input
                  type="number"
                  placeholder="Chars"
                  value={pair.value}
                  onChange={(e) => updateCharLimit(i, 'value', e.target.value)}
                  className="w-24"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeCharLimit(i)}
                  className="h-9 w-9 p-0 text-gray-400 hover:text-red-600"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
