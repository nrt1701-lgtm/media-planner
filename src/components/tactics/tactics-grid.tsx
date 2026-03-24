'use client'

import { useState, useCallback } from 'react'
import { useTactics } from '@/hooks/use-tactics'
import { useAdSpecs } from '@/hooks/use-ad-specs'
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import { TacticRow } from './tactic-row'
import { BudgetFooter } from './budget-footer'
import { BulkActionsBar } from './bulk-actions-bar'
import { PlusIcon } from 'lucide-react'
import type { RateType } from '@/lib/constants'

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

interface TacticsGridProps {
  campaignId: string
  campaignBudget: number
}

export function TacticsGrid({ campaignId, campaignBudget }: TacticsGridProps) {
  const { tactics, isLoading, mutate } = useTactics(campaignId)
  const { adSpecs } = useAdSpecs()

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [dragOverId, setDragOverId] = useState<string | null>(null)
  const [dragSourceId, setDragSourceId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)

  const allocatedBudget = tactics.reduce((sum: number, t: Tactic) => sum + (t.budget ?? 0), 0)

  // ─── CRUD helpers ────────────────────────────────────────────────────────────

  async function addTactic() {
    setAdding(true)
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/tactics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: '',
          sort_order: tactics.length,
          budget: 0,
          rate: 0,
          rate_type: 'CPM',
          ad_spec_ids: [],
        }),
      })
      if (!res.ok) return
      const created = await res.json()
      await mutate([...tactics, created])
    } finally {
      setAdding(false)
    }
  }

  async function patchTactic(id: string, updates: Partial<Tactic>) {
    // Optimistic update
    const optimistic = tactics.map((t: Tactic) => (t.id === id ? { ...t, ...updates } : t))
    mutate(optimistic, false)
    const res = await fetch(`/api/campaigns/${campaignId}/tactics/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    if (res.ok) {
      const saved = await res.json()
      // Only merge the fields we sent + server-recalculated est_impressions.
      // Spreading the full server response would overwrite concurrent optimistic
      // updates to other fields (e.g. budget save overwrites a pending rate edit).
      const merged: Partial<Tactic> = { ...updates, est_impressions: saved.est_impressions }
      mutate(
        (current: Tactic[] | undefined) =>
          (current ?? []).map((t: Tactic) => (t.id === id ? { ...t, ...merged } : t)),
        false
      )
    } else {
      // On error, revalidate to restore server state
      mutate()
    }
  }

  async function duplicateTactic(tactic: Tactic) {
    const { id: _id, ...rest } = tactic
    const res = await fetch(`/api/campaigns/${campaignId}/tactics`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...rest, sort_order: tactics.length, name: rest.name ? `${rest.name} (copy)` : '' }),
    })
    if (!res.ok) return
    const created = await res.json()
    await mutate([...tactics, created])
  }

  async function deleteTactic(id: string) {
    const optimistic = tactics.filter((t: Tactic) => t.id !== id)
    mutate(optimistic, false)
    await fetch(`/api/campaigns/${campaignId}/tactics/${id}`, { method: 'DELETE' })
    mutate()
    setSelectedIds((prev) => { const next = new Set(prev); next.delete(id); return next })
  }

  // ─── Selection ───────────────────────────────────────────────────────────────

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const allSelected = tactics.length > 0 && selectedIds.size === tactics.length
  const someSelected = selectedIds.size > 0 && selectedIds.size < tactics.length

  function toggleAll() {
    if (allSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(tactics.map((t: Tactic) => t.id)))
    }
  }

  // ─── Bulk actions ─────────────────────────────────────────────────────────────

  async function bulkDelete() {
    const ids = Array.from(selectedIds)
    await Promise.all(ids.map((id) => fetch(`/api/campaigns/${campaignId}/tactics/${id}`, { method: 'DELETE' })))
    await mutate(tactics.filter((t: Tactic) => !selectedIds.has(t.id)))
    setSelectedIds(new Set())
  }

  async function bulkDuplicate() {
    let currentLength = tactics.length
    const copies = await Promise.all(
      Array.from(selectedIds).map(async (id) => {
        const tactic = tactics.find((t: Tactic) => t.id === id)
        if (!tactic) return null
        const { id: _id, ...rest } = tactic
        const res = await fetch(`/api/campaigns/${campaignId}/tactics`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...rest, sort_order: currentLength++, name: rest.name ? `${rest.name} (copy)` : '' }),
        })
        if (!res.ok) return null
        return res.json()
      })
    )
    const valid = copies.filter(Boolean)
    await mutate([...tactics, ...valid])
  }

  async function bulkChangeDates(flightStart: string, flightEnd: string) {
    const updates: Partial<Tactic> = {}
    if (flightStart) updates.flight_start = flightStart
    if (flightEnd) updates.flight_end = flightEnd
    await Promise.all(
      Array.from(selectedIds).map((id) =>
        fetch(`/api/campaigns/${campaignId}/tactics/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        })
      )
    )
    await mutate(tactics.map((t: Tactic) => selectedIds.has(t.id) ? { ...t, ...updates } : t))
  }

  // ─── Drag reorder ─────────────────────────────────────────────────────────────

  const handleDragStart = useCallback((_e: React.DragEvent, id: string) => {
    setDragSourceId(id)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent, id: string) => {
    e.preventDefault()
    setDragOverId(id)
  }, [])

  const handleDrop = useCallback(
    async (e: React.DragEvent, targetId: string) => {
      e.preventDefault()
      if (!dragSourceId || dragSourceId === targetId) {
        setDragOverId(null)
        setDragSourceId(null)
        return
      }

      const sourceIdx = tactics.findIndex((t: Tactic) => t.id === dragSourceId)
      const targetIdx = tactics.findIndex((t: Tactic) => t.id === targetId)
      if (sourceIdx === -1 || targetIdx === -1) return

      const reordered: Tactic[] = [...tactics]
      const [moved] = reordered.splice(sourceIdx, 1)
      reordered.splice(targetIdx, 0, moved)

      const withOrder = reordered.map((t, i) => ({ ...t, sort_order: i }))
      mutate(withOrder, false)

      await fetch(`/api/campaigns/${campaignId}/tactics/reorder`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(withOrder.map(({ id, sort_order }) => ({ id, sort_order }))),
      })
      mutate()

      setDragOverId(null)
      setDragSourceId(null)
    },
    [dragSourceId, tactics, campaignId, mutate]
  )

  const handleDragEnd = useCallback(() => {
    setDragOverId(null)
    setDragSourceId(null)
  }, [])

  // ─── Render ──────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="p-6 space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-10 w-full rounded" />
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Bulk actions bar */}
      <BulkActionsBar
        selectedCount={selectedIds.size}
        onDeleteSelected={bulkDelete}
        onDuplicateSelected={bulkDuplicate}
        onChangeDates={bulkChangeDates}
        onClearSelection={() => setSelectedIds(new Set())}
      />

      {/* Table */}
      <div className="flex-1 overflow-auto">
        {tactics.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-gray-500 text-sm mb-4">
              No tactics yet — click &lsquo;Add Tactic&rsquo; to start building your plan
            </p>
            <Button onClick={addTactic} disabled={adding} size="sm" className="gap-1.5">
              <PlusIcon className="size-4" />
              {adding ? 'Adding...' : 'Add Tactic'}
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
                <TableHead className="w-8 pr-0">
                  <Checkbox
                    checked={allSelected}
                    ref={(el) => {
                      if (el) {
                        // indeterminate state
                        const input = (el as unknown as { querySelector: (s: string) => HTMLInputElement | null }).querySelector?.('input')
                        if (input) input.indeterminate = someSelected
                      }
                    }}
                    onCheckedChange={toggleAll}
                    aria-label="Select all"
                  />
                </TableHead>
                <TableHead className="w-6 px-1" />
                <TableHead className="min-w-[110px]">Platform</TableHead>
                <TableHead className="min-w-[110px]">Channel</TableHead>
                <TableHead className="min-w-[140px]">Name</TableHead>
                <TableHead className="min-w-[110px]">Placement</TableHead>
                <TableHead className="min-w-[120px]">Format(s)</TableHead>
                <TableHead className="min-w-[110px]">Flight Start</TableHead>
                <TableHead className="min-w-[110px]">Flight End</TableHead>
                <TableHead className="min-w-[100px]">Budget</TableHead>
                <TableHead className="min-w-[100px]">Rate Type</TableHead>
                <TableHead className="min-w-[90px]">Rate</TableHead>
                <TableHead className="min-w-[110px]">Est. Impr.</TableHead>
                <TableHead className="min-w-[150px]">Landing Page</TableHead>
                <TableHead className="w-8" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {tactics.map((tactic: Tactic) => (
                <TacticRow
                  key={tactic.id}
                  tactic={tactic}
                  adSpecs={adSpecs}
                  campaignId={campaignId}
                  isSelected={selectedIds.has(tactic.id)}
                  isDragOver={dragOverId === tactic.id}
                  onToggleSelect={toggleSelect}
                  onPatch={patchTactic}
                  onDuplicate={duplicateTactic}
                  onDelete={deleteTactic}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onDragEnd={handleDragEnd}
                />
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Add button (when tactics exist) */}
      {tactics.length > 0 && (
        <div className="px-4 py-2 border-t border-gray-200">
          <Button
            variant="ghost"
            size="sm"
            onClick={addTactic}
            disabled={adding}
            className="gap-1.5 text-gray-600 hover:text-gray-900"
          >
            <PlusIcon className="size-4" />
            {adding ? 'Adding...' : 'Add Tactic'}
          </Button>
        </div>
      )}

      {/* Budget footer */}
      <BudgetFooter allocated={allocatedBudget} total={campaignBudget} />
    </div>
  )
}
