'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Trash2 } from 'lucide-react'
import { UtmVariablePicker } from './utm-variable-picker'
import { UtmPreview } from './utm-preview'

interface UtmTemplate {
  id?: string
  name: string
  client_id?: string | null
  source_pattern: string
  medium_pattern: string
  campaign_pattern: string
  content_pattern: string
  term_pattern?: string | null
}

interface UtmTemplateEditorProps {
  template?: UtmTemplate | null
  onSaved: () => void
  onDeleted?: () => void
}

const EMPTY: UtmTemplate = {
  name: '',
  source_pattern: '{platform}',
  medium_pattern: '{channel_slug}',
  campaign_pattern: '{campaign_slug}',
  content_pattern: '{format}_{placement_slug}',
  term_pattern: '',
}

export function UtmTemplateEditor({ template, onSaved, onDeleted }: UtmTemplateEditorProps) {
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [form, setForm] = useState<UtmTemplate>(template ?? EMPTY)

  const isEdit = !!template?.id

  useEffect(() => {
    setForm(template ?? EMPTY)
  }, [template])

  function setField<K extends keyof UtmTemplate>(key: K, value: UtmTemplate[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSave() {
    setSaving(true)
    try {
      const payload = {
        ...form,
        term_pattern: form.term_pattern || null,
      }

      const url = isEdit ? `/api/utm-templates/${template!.id}` : '/api/utm-templates'
      const method = isEdit ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? 'Failed to save template')
      }

      toast.success(isEdit ? 'Template updated' : 'Template created')
      if (!isEdit) setForm(EMPTY)
      onSaved()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save template')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!template?.id || !confirm('Delete this UTM template?')) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/utm-templates/${template.id}`, { method: 'DELETE' })
      if (!res.ok && res.status !== 204) throw new Error('Delete failed')
      toast.success('Template deleted')
      onDeleted?.()
    } catch {
      toast.error('Failed to delete template')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="template-name">Template Name *</Label>
        <Input
          id="template-name"
          placeholder="e.g. Default, Meta-Specific"
          value={form.name}
          onChange={(e) => setField('name', e.target.value)}
        />
      </div>

      <Separator />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="source-pattern">utm_source pattern *</Label>
            <Input
              id="source-pattern"
              placeholder="{platform}"
              value={form.source_pattern}
              onChange={(e) => setField('source_pattern', e.target.value)}
              className="font-mono text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="medium-pattern">utm_medium pattern *</Label>
            <Input
              id="medium-pattern"
              placeholder="{channel_slug}"
              value={form.medium_pattern}
              onChange={(e) => setField('medium_pattern', e.target.value)}
              className="font-mono text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="campaign-pattern">utm_campaign pattern *</Label>
            <Input
              id="campaign-pattern"
              placeholder="{campaign_slug}"
              value={form.campaign_pattern}
              onChange={(e) => setField('campaign_pattern', e.target.value)}
              className="font-mono text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="content-pattern">utm_content pattern *</Label>
            <Input
              id="content-pattern"
              placeholder="{format}_{placement_slug}"
              value={form.content_pattern}
              onChange={(e) => setField('content_pattern', e.target.value)}
              className="font-mono text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="term-pattern">utm_term pattern (optional)</Label>
            <Input
              id="term-pattern"
              placeholder="{tactic_slug}"
              value={form.term_pattern ?? ''}
              onChange={(e) => setField('term_pattern', e.target.value)}
              className="font-mono text-sm"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Template'}
            </Button>
            {isEdit && (
              <Button
                variant="outline"
                onClick={handleDelete}
                disabled={deleting}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4 mr-1.5" />
                {deleting ? 'Deleting…' : 'Delete'}
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <UtmVariablePicker />
          <UtmPreview
            sourcePattern={form.source_pattern}
            mediumPattern={form.medium_pattern}
            campaignPattern={form.campaign_pattern}
            contentPattern={form.content_pattern}
            termPattern={form.term_pattern}
          />
        </div>
      </div>
    </div>
  )
}
