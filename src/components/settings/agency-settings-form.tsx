'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { useSettings } from '@/hooks/use-settings'
import { useUtmTemplates } from '@/hooks/use-utm-templates'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { LogoUpload } from './logo-upload'

interface SettingsData {
  agency_name?: string | null
  agency_logo_url?: string | null
  io_terms_template?: string | null
  creative_lead_time_days?: number | null
  default_utm_template_id?: string | null
}

export function AgencySettingsForm() {
  const { settings, isLoading, mutate } = useSettings()
  const { templates } = useUtmTemplates()

  const [saving, setSaving] = useState(false)
  const [agencyName, setAgencyName] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [ioTerms, setIoTerms] = useState('')
  const [leadTimeDays, setLeadTimeDays] = useState<string>('5')
  const [defaultUtmTemplateId, setDefaultUtmTemplateId] = useState<string>('none')

  useEffect(() => {
    if (!settings) return
    const s = settings as SettingsData
    setAgencyName(s.agency_name ?? '')
    setLogoUrl(s.agency_logo_url ?? '')
    setIoTerms(s.io_terms_template ?? '')
    setLeadTimeDays(String(s.creative_lead_time_days ?? 5))
    setDefaultUtmTemplateId(s.default_utm_template_id ?? 'none')
  }, [settings])

  async function handleSave() {
    setSaving(true)
    try {
      const payload: SettingsData = {
        agency_name: agencyName || undefined,
        agency_logo_url: logoUrl || null,
        io_terms_template: ioTerms || undefined,
        creative_lead_time_days: leadTimeDays ? parseInt(leadTimeDays, 10) : undefined,
        default_utm_template_id: defaultUtmTemplateId === 'none' ? null : defaultUtmTemplateId,
      }

      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? 'Failed to save settings')
      }

      const updated = await res.json()
      mutate(updated, false)
      toast.success('Settings saved')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="agency-name">Agency Name</Label>
        <Input
          id="agency-name"
          placeholder="Your Agency Name"
          value={agencyName}
          onChange={(e) => setAgencyName(e.target.value)}
        />
      </div>

      <LogoUpload value={logoUrl} onChange={setLogoUrl} />

      <div className="space-y-2">
        <Label htmlFor="io-terms">IO Terms Template</Label>
        <Textarea
          id="io-terms"
          placeholder="Enter standard IO terms and conditions. Markdown is supported."
          value={ioTerms}
          onChange={(e) => setIoTerms(e.target.value)}
          rows={8}
          className="font-mono text-sm"
        />
        <p className="text-xs text-gray-500">
          These terms will appear at the bottom of every generated IO PDF. Markdown formatting is supported.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="lead-time">Creative Lead Time (days)</Label>
        <Input
          id="lead-time"
          type="number"
          min={1}
          value={leadTimeDays}
          onChange={(e) => setLeadTimeDays(e.target.value)}
          className="w-32"
        />
        <p className="text-xs text-gray-500">
          Business days required before campaign start for creative delivery.
        </p>
      </div>

      <div className="space-y-2">
        <Label>Default UTM Template</Label>
        <Select value={defaultUtmTemplateId} onValueChange={setDefaultUtmTemplateId}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Select a template" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            {(templates as Array<{ id: string; name: string }>).map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-gray-500">
          This template will be pre-selected when generating UTM sheets.
        </p>
      </div>

      <div className="pt-2">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save Settings'}
        </Button>
      </div>
    </div>
  )
}
