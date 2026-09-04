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
import type { DimensionGroup } from '@/lib/budget/filters'

interface BudgetByDimensionChartProps {
  groups: DimensionGroup[]
  colorMap: Map<string, string>
  emptyMessage?: string
}

function formatCurrency(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return `$${n.toFixed(0)}`
}

export function BudgetByDimensionChart({
  groups,
  colorMap,
  emptyMessage = 'No data yet',
}: BudgetByDimensionChartProps) {
  if (groups.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-sm text-muted-foreground">
        {emptyMessage}
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={Math.max(180, groups.length * 48)}>
      <BarChart
        data={groups}
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
          cursor={{ fill: 'rgba(26, 138, 125, 0.06)' }}
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
          {groups.map((group) => (
            <Cell key={group.key} fill={colorMap.get(group.key) ?? '#1A8A7D'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
