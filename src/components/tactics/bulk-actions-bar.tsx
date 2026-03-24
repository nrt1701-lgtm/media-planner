'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Trash2Icon, CopyIcon, CalendarIcon } from 'lucide-react'

interface BulkActionsBarProps {
  selectedCount: number
  onDeleteSelected: () => Promise<void>
  onDuplicateSelected: () => Promise<void>
  onChangeDates: (flightStart: string, flightEnd: string) => Promise<void>
  onClearSelection: () => void
}

export function BulkActionsBar({
  selectedCount,
  onDeleteSelected,
  onDuplicateSelected,
  onChangeDates,
  onClearSelection,
}: BulkActionsBarProps) {
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [datesOpen, setDatesOpen] = useState(false)
  const [flightStart, setFlightStart] = useState('')
  const [flightEnd, setFlightEnd] = useState('')
  const [busy, setBusy] = useState(false)

  if (selectedCount === 0) return null

  async function handleDelete() {
    setBusy(true)
    try {
      await onDeleteSelected()
      setDeleteOpen(false)
      onClearSelection()
    } finally {
      setBusy(false)
    }
  }

  async function handleDuplicate() {
    setBusy(true)
    try {
      await onDuplicateSelected()
    } finally {
      setBusy(false)
    }
  }

  async function handleChangeDates() {
    setBusy(true)
    try {
      await onChangeDates(flightStart, flightEnd)
      setDatesOpen(false)
      onClearSelection()
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <div className="flex items-center gap-3 px-4 py-2.5 bg-brand-teal/10 border-b border-brand-teal/30">
        <span className="text-sm font-medium text-brand-teal">
          {selectedCount} tactic{selectedCount !== 1 ? 's' : ''} selected
        </span>
        <div className="flex items-center gap-2 ml-2">
          <Button
            variant="outline"
            size="sm"
            className="h-7 gap-1.5 text-xs"
            onClick={() => setDatesOpen(true)}
          >
            <CalendarIcon className="size-3.5" />
            Change Dates
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 gap-1.5 text-xs"
            onClick={handleDuplicate}
            disabled={busy}
          >
            <CopyIcon className="size-3.5" />
            Duplicate
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 gap-1.5 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2Icon className="size-3.5" />
            Delete
          </Button>
        </div>
        <button
          type="button"
          onClick={onClearSelection}
          className="ml-auto text-xs text-brand-teal hover:text-brand-teal"
        >
          Clear selection
        </button>
      </div>

      {/* Delete confirmation */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete {selectedCount} tactic{selectedCount !== 1 ? 's' : ''}?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. All selected tactics will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={busy}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={busy}>
              {busy ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Dates */}
      <Dialog open={datesOpen} onOpenChange={setDatesOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Change Flight Dates</DialogTitle>
            <DialogDescription>
              Set flight dates for all {selectedCount} selected tactic{selectedCount !== 1 ? 's' : ''}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="bulk-start" className="text-xs">Flight Start</Label>
              <Input
                id="bulk-start"
                type="date"
                value={flightStart}
                onChange={(e) => setFlightStart(e.target.value)}
                className="h-8"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bulk-end" className="text-xs">Flight End</Label>
              <Input
                id="bulk-end"
                type="date"
                value={flightEnd}
                onChange={(e) => setFlightEnd(e.target.value)}
                className="h-8"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDatesOpen(false)} disabled={busy}>
              Cancel
            </Button>
            <Button onClick={handleChangeDates} disabled={busy || (!flightStart && !flightEnd)}>
              {busy ? 'Saving...' : 'Apply'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
