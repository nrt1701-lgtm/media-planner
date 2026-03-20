'use client'

import { useState } from 'react'
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
import { InlineCell } from './inline-cell'
import { ChannelSelect } from './channel-select'
import { AdSpecPicker } from './ad-spec-picker'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { GripVerticalIcon, MoreHorizontalIcon, CopyIcon, Trash2Icon } from 'lucide-react'
import { RATE_TYPES, type RateType } from '@/lib/constants'
import { calculateImpressions } from '@/lib/impressions/calculate'

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
  sort_order?: number
}

interface TacticRowProps {
  tactic: Tactic
  adSpecs: AdSpec[]
  campaignId: string
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
  campaignId,
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
        className={`group transition-colors ${isDragOver ? 'bg-blue-50 border-t-2 border-t-blue-400' : ''} ${isSelected ? 'bg-blue-50/60' : ''}`}
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
          <GripVerticalIcon className="size-4 text-gray-300 group-hover:text-gray-400" />
        </TableCell>

        {/* Name */}
        <TableCell className="min-w-[140px]">
          <InlineCell
            value={tactic.name}
            placeholder="Tactic name"
            onSave={(v) => patch({ name: v })}
          />
        </TableCell>

        {/* Channel */}
        <TableCell className="min-w-[110px]">
          <ChannelSelect
            value={tactic.channel}
            onSave={(v) => patch({ channel: v })}
          />
        </TableCell>

        {/* Platform */}
        <TableCell className="min-w-[110px]">
          <InlineCell
            value={tactic.platform}
            placeholder="—"
            onSave={(v) => patch({ platform: v })}
          />
        </TableCell>

        {/* Placement */}
        <TableCell className="min-w-[110px]">
          <InlineCell
            value={tactic.placement}
            placeholder="—"
            onSave={(v) => patch({ placement: v })}
          />
        </TableCell>

        {/* Formats (ad specs) */}
        <TableCell className="min-w-[120px]">
          <button
            type="button"
            onClick={() => setAdSpecOpen(true)}
            className="flex flex-wrap gap-1 min-h-[28px] w-full text-left rounded px-1.5 py-0.5 hover:bg-blue-50 hover:ring-1 hover:ring-blue-200 transition-colors"
          >
            {tacticAdSpecs.length === 0 ? (
              <span className="text-gray-400 text-sm">—</span>
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
            value={tactic.flight_start}
            variant="date"
            placeholder="—"
            displayFormat={formatDate}
            onSave={(v) => patch({ flight_start: v || null })}
          />
        </TableCell>

        {/* Flight End */}
        <TableCell className="min-w-[110px]">
          <InlineCell
            value={tactic.flight_end}
            variant="date"
            placeholder="—"
            displayFormat={formatDate}
            onSave={(v) => patch({ flight_end: v || null })}
          />
        </TableCell>

        {/* Budget */}
        <TableCell className="min-w-[100px]">
          <InlineCell
            value={tactic.budget}
            variant="number"
            placeholder="$0"
            displayFormat={(v) => formatCurrency(v as number)}
            onSave={(v) => patch({ budget: v === '' ? 0 : parseFloat(v) })}
          />
        </TableCell>

        {/* Rate Type */}
        <TableCell className="min-w-[100px]">
          <Select
            value={tactic.rate_type ?? 'CPM'}
            onValueChange={(v) => patch({ rate_type: v as RateType })}
          >
            <SelectTrigger className="h-7 w-full border-transparent bg-transparent hover:bg-blue-50 hover:border-blue-200 text-sm px-1.5 focus:ring-2 focus:ring-blue-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RATE_TYPES.map((rt) => (
                <SelectItem key={rt} value={rt}>
                  {rt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </TableCell>

        {/* Rate */}
        <TableCell className="min-w-[90px]">
          <InlineCell
            value={tactic.rate}
            variant="number"
            placeholder="—"
            displayFormat={(v) => v == null ? null : `$${v}`}
            onSave={(v) => patch({ rate: v === '' ? 0 : parseFloat(v) })}
          />
        </TableCell>

        {/* Est. Impressions */}
        <TableCell className="min-w-[110px] text-gray-600 text-sm px-2">
          {formatImpressions(tactic.est_impressions) ?? <span className="text-gray-400">—</span>}
        </TableCell>

        {/* Landing Page URL */}
        <TableCell className="min-w-[150px]">
          <InlineCell
            value={tactic.landing_page_url}
            placeholder="—"
            onSave={(v) => patch({ landing_page_url: v || null })}
          />
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
