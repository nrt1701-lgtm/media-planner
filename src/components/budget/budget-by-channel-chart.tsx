'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'

interface Tactic {
  channel?: string | null
  budget?: number | null
}

interface Channel {
  id: string
  name: string
  color?: string | null
}

interface BudgetByChannelChartProps {
  tactics: Tactic[]
  channels: Channel[]
}

function formatCurrency(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return `$${n.toFixed(0)}`
}

const DEFAULT_COLORS = [
  '#1A8A7D', '#C45A2C', '#D4A34A', '#7A94A8', '#4A3728',
  '#2CB5A5', '#D97B56', '#E0BD6E', '#95AEC0', '#6B5444',
]

export function BudgetByChannelChart({ tactics, channels }: BudgetByChannelChartProps) {
  // Group tactics by channel
  const channelMap = new Map<string, number>()
  for (const tactic of tactics) {
    const ch = tactic.channel ?? 'Unassigned'
    channelMap.set(ch, (channelMap.get(ch) ?? 0) + (tactic.budget ?? 0))
  }

  const data = Array.from(channelMap.entries())
    .map(([name, budget]) => ({ name, budget }))
    .sort((a, b) => b.budget - a.budget)

  function getColor(channelName: string, index: number) {
    const channel = channels.find(
      (c) => c.name.toLowerCase() === channelName.toLowerCase()
    )
    return channel?.color ?? DEFAULT_COLORS[index % DEFAULT_COLORS.length]
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-sm text-muted-foreground">
        No channel data yet
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={Math.max(180, data.length * 48)}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
      >
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#EDE6D8" />
        <XAxis
          type="number"
          tickFormatter={formatCurrency}
          tick={{ fontSize: 11, fill: '#7A94A8' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="name"
          width={100}
          tick={{ fontSize: 12, fill: '#4A3728' }}
          axisLine={false}
          tickLine={false}
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
            border: '1px solid #EDE6D8',
            borderRadius: '6px',
            fontSize: 12,
          }}
        />
        <Bar dataKey="budget" radius={[0, 4, 4, 0]} maxBarSize={32}>
          {data.map((entry, index) => (
            <Cell key={entry.name} fill={getColor(entry.name, index)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
