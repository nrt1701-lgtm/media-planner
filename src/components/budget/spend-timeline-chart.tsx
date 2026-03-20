'use client'

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { format } from 'date-fns'
import { generatePeriods } from '@/lib/budget/periods'
import { allocateBudget } from '@/lib/budget/allocate'

interface Tactic {
  budget?: number | null
  flight_start?: string | null
  flight_end?: string | null
}

interface Campaign {
  start_date?: string | null
  end_date?: string | null
}

interface SpendTimelineChartProps {
  tactics: Tactic[]
  campaign: Campaign
}

function formatCurrency(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return `$${n.toFixed(0)}`
}

export function SpendTimelineChart({ tactics, campaign }: SpendTimelineChartProps) {
  if (!campaign?.start_date || !campaign?.end_date) {
    return (
      <div className="flex items-center justify-center h-40 text-sm text-gray-400">
        Set campaign dates to see spend timeline
      </div>
    )
  }

  const campaignStart = new Date(campaign.start_date)
  const campaignEnd = new Date(campaign.end_date)
  const periods = generatePeriods(campaignStart, campaignEnd)

  // Initialize period totals
  const periodTotals = periods.map((p) => ({
    label: format(p.start, 'MMM d'),
    amount: 0,
    start: p.start,
    end: p.end,
  }))

  // Accumulate allocations from each tactic
  for (const tactic of tactics) {
    if (!tactic.budget || !tactic.flight_start || !tactic.flight_end) continue
    const tacticStart = new Date(tactic.flight_start)
    const tacticEnd = new Date(tactic.flight_end)
    const allocations = allocateBudget(tactic.budget, tacticStart, tacticEnd, periods)
    allocations.forEach((alloc, i) => {
      periodTotals[i].amount += alloc.amount
    })
  }

  const data = periodTotals.map((p) => ({
    label: p.label,
    amount: Math.round(p.amount),
  }))

  const hasData = data.some((d) => d.amount > 0)

  if (!hasData) {
    return (
      <div className="flex items-center justify-center h-40 text-sm text-gray-400">
        Add tactics with budgets and flight dates to see timeline
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 8, right: 16, left: 8, bottom: 4 }}>
        <defs>
          <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#4F46E5" stopOpacity={0.01} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: '#6B7280' }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tickFormatter={formatCurrency}
          tick={{ fontSize: 11, fill: '#6B7280' }}
          axisLine={false}
          tickLine={false}
          width={52}
        />
        <Tooltip
          formatter={(value) =>
            typeof value === 'number'
              ? new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD',
                  maximumFractionDigits: 0,
                }).format(value)
              : value
          }
          contentStyle={{
            border: '1px solid #E5E7EB',
            borderRadius: '6px',
            fontSize: 12,
          }}
        />
        <Area
          type="monotone"
          dataKey="amount"
          stroke="#4F46E5"
          strokeWidth={2}
          fill="url(#spendGradient)"
          dot={false}
          activeDot={{ r: 4, strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
