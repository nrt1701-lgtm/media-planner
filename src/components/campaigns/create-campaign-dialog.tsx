'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { formatWorkamajigCode } from '@/lib/workamajig/format'

interface CreateCampaignDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  clientId: string
  clientCode: string
}

export function CreateCampaignDialog({
  open,
  onOpenChange,
  onSuccess,
  clientId,
  clientCode,
}: CreateCampaignDialogProps) {
  const [name, setName] = useState('')
  const [expenseNumber, setExpenseNumber] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [budget, setBudget] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const workamajigCode = useMemo(() => {
    if (!expenseNumber || !clientCode) return null
    const year = startDate ? new Date(startDate).getFullYear() : new Date().getFullYear()
    return formatWorkamajigCode(year, clientCode, expenseNumber)
  }, [expenseNumber, clientCode, startDate])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: clientId,
          name,
          expense_number: expenseNumber,
          start_date: startDate,
          end_date: endDate,
          total_budget: budget ? parseFloat(budget) : 0,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data?.error?.formErrors?.[0] ?? 'Failed to create campaign')
      }

      setName('')
      setExpenseNumber('')
      setStartDate('')
      setEndDate('')
      setBudget('')
      onSuccess()
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Campaign</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="campaign-name">Campaign Name</Label>
            <Input
              id="campaign-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Q1 Brand Awareness"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="expense-number">Expense Number</Label>
            <Input
              id="expense-number"
              value={expenseNumber}
              onChange={(e) => setExpenseNumber(e.target.value)}
              placeholder="1234"
              required
            />
          </div>
          {workamajigCode && (
            <div className="rounded-md bg-blue-50 border border-blue-200 px-3 py-2">
              <p className="text-xs text-blue-600 font-medium">Workamajig Code Preview</p>
              <p className="text-sm font-mono font-semibold text-blue-800 mt-0.5">{workamajigCode}</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-date">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="budget">Total Budget ($)</Label>
            <Input
              id="budget"
              type="number"
              min="0"
              step="0.01"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="0.00"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating…' : 'Create Campaign'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
