'use client'

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import type { DimensionGroup } from '@/lib/budget/filters'

interface DimensionMixChartProps {
  groups: DimensionGroup[]
  colorMap: Map<string, string>
  emptyMessage?: string
}

export function DimensionMixChart({
  groups,
  colorMap,
  emptyMessage = 'No data yet',
}: DimensionMixChartProps) {
  // A zero-budget group has no slice to draw, but it still legitimately
  // exists in the bar chart (a tactic with no budget yet), so it is dropped
  // here only.
  const data = groups.filter((group) => group.budget > 0)
  const total = data.reduce((sum, group) => sum + group.budget, 0)

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-sm text-muted-foreground">
        {emptyMessage}
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="45%"
          innerRadius={52}
          outerRadius={84}
          paddingAngle={2}
          dataKey="budget"
          nameKey="name"
        >
          {data.map((group) => (
            <Cell key={group.key} fill={colorMap.get(group.key) ?? '#1A8A7D'} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value) => {
            if (typeof value !== 'number') return value
            const amount = new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD',
              maximumFractionDigits: 0,
            }).format(value)
            // The point of this chart is mix, so lead the tooltip with share
            // of the currently filtered total.
            const share = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0'
            return `${share}% · ${amount}`
          }}
          contentStyle={{
            border: '1px solid #EDE6D8',
            borderRadius: '6px',
            fontSize: 12,
          }}
        />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 12, color: '#4A3728' }}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
