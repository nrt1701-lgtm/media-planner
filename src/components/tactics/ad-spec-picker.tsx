'use client'

import { useState, useMemo } from 'react'
import { useAdSpecs } from '@/hooks/use-ad-specs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'

interface AdSpec {
  id: string
  platform: string
  placement: string
  format_name: string
  dimensions?: string | null
}

interface AdSpecPickerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedIds: string[]
  platform?: string
  onSave: (ids: string[]) => void
}

export function AdSpecPicker({ open, onOpenChange, selectedIds, platform, onSave }: AdSpecPickerProps) {
  const { adSpecs, isLoading } = useAdSpecs()
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set(selectedIds))

  // Reset selection when dialog opens
  const handleOpenChange = (o: boolean) => {
    if (o) setSelected(new Set(selectedIds))
    else setSearch('')
    onOpenChange(o)
  }

  const filtered = useMemo(() => {
    let specs: AdSpec[] = adSpecs
    if (platform) {
      specs = specs.filter((s: AdSpec) => s.platform.toLowerCase() === platform.toLowerCase())
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      specs = specs.filter(
        (s: AdSpec) =>
          s.platform.toLowerCase().includes(q) ||
          s.placement.toLowerCase().includes(q) ||
          s.format_name.toLowerCase().includes(q)
      )
    }
    return specs
  }, [adSpecs, platform, search])

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function handleSave() {
    onSave(Array.from(selected))
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Select Ad Specs</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input
            placeholder="Search by platform, placement, or format..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8"
          />
          {selected.size > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {Array.from(selected).map((id) => {
                const spec = adSpecs.find((s: AdSpec) => s.id === id)
                if (!spec) return null
                return (
                  <Badge key={id} variant="secondary" className="text-xs gap-1">
                    {spec.format_name}
                    <button
                      type="button"
                      onClick={() => toggle(id)}
                      className="ml-0.5 hover:text-red-500"
                    >
                      ×
                    </button>
                  </Badge>
                )
              })}
            </div>
          )}
          <div className="max-h-72 overflow-y-auto rounded border border-border divide-y divide-border">
            {isLoading ? (
              <div className="p-4 text-sm text-muted-foreground text-center">Loading...</div>
            ) : filtered.length === 0 ? (
              <div className="p-4 text-sm text-muted-foreground text-center">No specs found.</div>
            ) : (
              filtered.map((spec: AdSpec) => (
                <label
                  key={spec.id}
                  className="flex items-start gap-3 px-3 py-2.5 hover:bg-muted cursor-pointer"
                >
                  <Checkbox
                    checked={selected.has(spec.id)}
                    onCheckedChange={() => toggle(spec.id)}
                    className="mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground">{spec.format_name}</div>
                    <div className="text-xs text-muted-foreground">
                      {spec.platform} · {spec.placement}
                      {spec.dimensions && ` · ${spec.dimensions}`}
                    </div>
                  </div>
                </label>
              ))
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Apply ({selected.size} selected)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
