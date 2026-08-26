'use client'

import { useState, useRef, useCallback } from 'react'
import { TableRow, TableCell } from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { InlineCell, type CellHandle } from './inline-cell'
import { ChannelSelect } from './channel-select'
import { RateTypeSelect } from './rate-type-select'
import { AudienceSelect } from './audience-select'
import { FunnelStageSelect } from './funnel-stage-select'
import type { Audience } from '@/hooks/use-audiences'
import { AdSpecPicker } from './ad-spec-picker'
import { GripVerticalIcon, MoreHorizontalIcon, CopyIcon, Trash2Icon } from 'lucide-react'
import { type RateType, type FunnelStage } from '@/lib/constants'
import { calculateImpressions } from '@/lib/impressions/calculate'
import { toGross } from '@/lib/budget/markup'

const TAB_ORDER = [
  'platform', 'channel', 'name', 'audience_id', 'placement',
  'funnel_stage', 'objective',
  'flight_start', 'flight_end', 'budget', 'rate_type', 'rate',
  'landing_page_url',
] as const

interface AdSpec {
  id: string
  format_name: string
}

interface Tactic {
  id: string
  name: string
  channel?: string | null
  platform?: string | null
  placement?: string | null
  ad_spec_ids?: string[]
  flight_start?: string | null
  flight_end?: string | null
  budget?: number | null
  rate_type?: RateType | null
  rate?: number | null
  est_impressions?: number | null
  landing_page_url?: string | null
  audience_id?: string | null
  funnel_stage?: FunnelStage | null
  objective?: string | null
  sort_order?: number
}

interface TacticRowProps {
  tactic: Tactic
  adSpecs: AdSpec[]
  audiences: Audience[]
  campaignId: string
  markupPercentage: number
  isSelected: boolean
  isDragOver: boolean
  onToggleSelect: (id: string) => void
  onPatch: (id: string, updates: Partial<Tactic>) => Promise<void>
  onDuplicate: (tactic: Tactic) => Promise<void>
  onDelete: (id: string) => Promise<void>
  // Drag
  onDragStart: (e: React.DragEvent, id: string) => void
  onDragOver: (e: React.DragEvent, id: string) => void
  onDrop: (e: React.DragEvent, id: string) => void
  onDragEnd: () => void
}

function formatDate(v: string | number | null | undefined): string | null {
  const d = v == null ? null : String(v)
  if (!d) return null
  // ISO date yyyy-mm-dd → mm/dd/yy
  const parts = d.split('-')
  if (parts.length !== 3) return d
  const [y, m, day] = parts
  return `${m}/${day}/${y.slice(2)}`
}

function formatCurrency(n: number | null | undefined) {
  if (n == null) return null
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}

function formatImpressions(n: number | null | undefined) {
  if (n == null) return null
  return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(n)
}

export function TacticRow({
  tactic,
  adSpecs,
  audiences,
  campaignId,
  markupPercentage,
  isSelected,
  isDragOver,
  onToggleSelect,
  onPatch,
  onDuplicate,
  onDelete,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: TacticRowProps) {
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [adSpecOpen, setAdSpecOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Cell focus registry for Tab navigation
  const cellRefs = useRef<Record<string, CellHandle | null>>({})

  const focusCell = useCallback((currentKey: string, direction: 1 | -1) => {
    const idx = TAB_ORDER.indexOf(currentKey as typeof TAB_ORDER[number])
    const nextIdx = idx + direction
    if (nextIdx >= 0 && nextIdx < TAB_ORDER.length) {
      cellRefs.current[TAB_ORDER[nextIdx]]?.focus()
    }
  }, [])

  // Auto-suggest name when empty and channel/platform/placement are set
  function buildSuggestedName(updates: Partial<Tactic>) {
    const ch = updates.channel ?? tactic.channel
    const pl = updates.platform ?? tactic.platform
    const plc = updates.placement ?? tactic.placement
    if (!tactic.name && (ch || pl || plc)) {
      return [ch, pl, plc].filter(Boolean).join(' - ')
    }
    return undefined
  }

  async function patch(updates: Partial<Tactic>) {
    // Auto-recalc impressions client-side for CPM
    const rateType = (updates.rate_type ?? tactic.rate_type) as RateType
    const budget = updates.budget ?? tactic.budget
    const rate = updates.rate ?? tactic.rate
    if (rateType === 'CPM' && budget != null && rate != null) {
      updates.est_impressions = calculateImpressions(budget, rate, 'CPM')
    }
    // Auto-suggest name
    if (!tactic.name || tactic.name === '') {
      const suggested = buildSuggestedName(updates)
      if (suggested) updates.name = suggested
    }
    await onPatch(tactic.id, updates)
  }

  async function handleDeleteConfirm() {
    setDeleting(true)
    try {
      await onDelete(tactic.id)
      setDeleteOpen(false)
    } finally {
      setDeleting(false)
    }
  }

  const tacticAdSpecs = (tactic.ad_spec_ids ?? [])
    .map((id) => adSpecs.find((s) => s.id === id))
    .filter(Boolean) as AdSpec[]

  return (
    <>
      <TableRow
        className={`group transition-colors ${isDragOver ? 'bg-brand-teal/10 border-t-2 border-t-brand-teal' : ''} ${isSelected ? 'bg-brand-teal/10' : ''}`}
        draggable
        onDragStart={(e) => onDragStart(e, tactic.id)}
        onDragOver={(e) => onDragOver(e, tactic.id)}
        onDrop={(e) => onDrop(e, tactic.id)}
        onDragEnd={onDragEnd}
      >
        {/* Checkbox */}
        <TableCell className="w-8 pr-0">
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onToggleSelect(tactic.id)}
            aria-label="Select tactic"
          />
        </TableCell>

        {/* Drag handle */}
        <TableCell className="w-6 px-1 cursor-grab active:cursor-grabbing">
          <GripVerticalIcon className="size-4 text-muted-foreground group-hover:text-muted-foreground" />
        </TableCell>

        {/* Platform */}
        <TableCell className="min-w-[110px]">
          <InlineCell
            ref={(h) => { cellRefs.current.platform = h }}
            value={tactic.platform}
            placeholder="—"
            onSave={(v) => patch({ platform: v })}
            onTab={() => focusCell('platform', 1)}
            onShiftTab={() => focusCell('platform', -1)}
          />
        </TableCell>

        {/* Channel */}
        <TableCell className="min-w-[110px]">
          <ChannelSelect
            ref={(h) => { cellRefs.current.channel = h }}
            value={tactic.channel}
            onSave={(v) => patch({ channel: v })}
            onTab={() => focusCell('channel', 1)}
            onShiftTab={() => focusCell('channel', -1)}
          />
        </TableCell>

        {/* Name */}
        <TableCell className="min-w-[140px]">
          <InlineCell
            ref={(h) => { cellRefs.current.name = h }}
            value={tactic.name}
            placeholder="Tactic name"
            onSave={(v) => patch({ name: v })}
            onTab={() => focusCell('name', 1)}
            onShiftTab={() => focusCell('name', -1)}
          />
        </TableCell>

        {/* Audience */}
        <TableCell className="min-w-[130px]">
          <AudienceSelect
            ref={(h) => { cellRefs.current.audience_id = h }}
            audiences={audiences}
            value={tactic.audience_id}
            onSave={(v) => patch({ audience_id: v })}
            onTab={() => focusCell('audience_id', 1)}
            onShiftTab={() => focusCell('audience_id', -1)}
          />
        </TableCell>

        {/* Placement */}
        <TableCell className="min-w-[110px]">
          <InlineCell
            ref={(h) => { cellRefs.current.placement = h }}
            value={tactic.placement}
            placeholder="—"
            onSave={(v) => patch({ placement: v })}
            onTab={() => focusCell('placement', 1)}
            onShiftTab={() => focusCell('placement', -1)}
          />
        </TableCell>

        {/* Funnel Location */}
        <TableCell className="min-w-[110px]">
          <FunnelStageSelect
            ref={(h) => { cellRefs.current.funnel_stage = h }}
            value={tactic.funnel_stage}
            onSave={(v) => patch({ funnel_stage: v })}
            onTab={() => focusCell('funnel_stage', 1)}
            onShiftTab={() => focusCell('funnel_stage', -1)}
          />
        </TableCell>

        {/* Objective */}
        <TableCell className="min-w-[130px]">
          <InlineCell
            ref={(h) => { cellRefs.current.objective = h }}
            value={tactic.objective}
            placeholder="—"
            onSave={(v) => patch({ objective: v || null })}
            onTab={() => focusCell('objective', 1)}
            onShiftTab={() => focusCell('objective', -1)}
          />
        </TableCell>

        {/* Formats (ad specs) — skipped in tab order */}
        <TableCell className="min-w-[120px]">
          <button
            type="button"
            onClick={() => setAdSpecOpen(true)}
            className="flex flex-wrap gap-1 min-h-[28px] w-full text-left rounded px-1.5 py-0.5 hover:bg-brand-teal/10 hover:ring-1 hover:ring-brand-teal/30 transition-colors"
          >
            {tacticAdSpecs.length === 0 ? (
              <span className="text-muted-foreground text-sm">—</span>
            ) : (
              tacticAdSpecs.map((s) => (
                <Badge key={s.id} variant="secondary" className="text-xs font-normal">
                  {s.format_name}
                </Badge>
              ))
            )}
          </button>
        </TableCell>

        {/* Flight Start */}
        <TableCell className="min-w-[110px]">
          <InlineCell
            ref={(h) => { cellRefs.current.flight_start = h }}
            value={tactic.flight_start}
            variant="date"
            placeholder="—"
            displayFormat={formatDate}
            onSave={(v) => patch({ flight_start: v || null })}
            onTab={() => focusCell('flight_start', 1)}
            onShiftTab={() => focusCell('flight_start', -1)}
          />
        </TableCell>

        {/* Flight End */}
        <TableCell className="min-w-[110px]">
          <InlineCell
            ref={(h) => { cellRefs.current.flight_end = h }}
            value={tactic.flight_end}
            variant="date"
            placeholder="—"
            displayFormat={formatDate}
            onSave={(v) => patch({ flight_end: v || null })}
            onTab={() => focusCell('flight_end', 1)}
            onShiftTab={() => focusCell('flight_end', -1)}
          />
        </TableCell>

        {/* Budget */}
        <TableCell className="min-w-[100px]">
          <InlineCell
            ref={(h) => { cellRefs.current.budget = h }}
            value={tactic.budget}
            variant="number"
            placeholder="$0"
            displayFormat={(v) => formatCurrency(v as number)}
            onSave={(v) => patch({ budget: v === '' ? 0 : parseFloat(v) })}
            onTab={() => focusCell('budget', 1)}
            onShiftTab={() => focusCell('budget', -1)}
          />
        </TableCell>

        {/* Rate Type */}
        <TableCell className="min-w-[100px]">
          <RateTypeSelect
            ref={(h) => { cellRefs.current.rate_type = h }}
            value={tactic.rate_type}
            onSave={(v) => patch({ rate_type: v })}
            onTab={() => focusCell('rate_type', 1)}
            onShiftTab={() => focusCell('rate_type', -1)}
          />
        </TableCell>

        {/* Rate */}
        <TableCell className="min-w-[90px]">
          <InlineCell
            ref={(h) => { cellRefs.current.rate = h }}
            value={tactic.rate}
            variant="number"
            placeholder="—"
            displayFormat={(v) => v == null ? null : `$${v}`}
            onSave={(v) => patch({ rate: v === '' ? 0 : parseFloat(v) })}
            onTab={() => focusCell('rate', 1)}
            onShiftTab={() => focusCell('rate', -1)}
          />
        </TableCell>

        {/* Est. Impressions — read-only, skipped in tab order */}
        <TableCell className="min-w-[110px] text-muted-foreground text-sm px-2">
          {formatImpressions(tactic.est_impressions) ?? <span className="text-muted-foreground">—</span>}
        </TableCell>

        {/* Landing Page URL */}
        <TableCell className="min-w-[150px]">
          <InlineCell
            ref={(h) => { cellRefs.current.landing_page_url = h }}
            value={tactic.landing_page_url}
            placeholder="—"
            onSave={(v) => patch({ landing_page_url: v || null })}
            onTab={() => focusCell('landing_page_url', 1)}
            onShiftTab={() => focusCell('landing_page_url', -1)}
          />
        </TableCell>

        {/* Gross Cost — read-only, computed from net budget + client markup, skipped in tab order */}
        <TableCell className="min-w-[100px] text-muted-foreground text-sm px-2">
          {tactic.budget != null ? formatCurrency(toGross(tactic.budget, markupPercentage)) : <span className="text-muted-foreground">—</span>}
        </TableCell>

        {/* Actions */}
        <TableCell className="w-8">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreHorizontalIcon className="size-4" />
                <span className="sr-only">Row actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onDuplicate(tactic)}>
                <CopyIcon className="size-4 mr-2" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600 focus:text-red-600 focus:bg-red-50"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2Icon className="size-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>

      {/* Delete confirmation */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete tactic?</DialogTitle>
            <DialogDescription>
              &ldquo;{tactic.name || 'Untitled tactic'}&rdquo; will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} disabled={deleting}>
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ad Spec Picker */}
      <AdSpecPicker
        open={adSpecOpen}
        onOpenChange={setAdSpecOpen}
        selectedIds={tactic.ad_spec_ids ?? []}
        platform={tactic.platform ?? undefined}
        onSave={(ids) => patch({ ad_spec_ids: ids })}
      />
    </>
  )
}
