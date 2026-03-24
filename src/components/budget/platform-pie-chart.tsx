'use client'

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

interface Tactic {
  platform?: string | null
  budget?: number | null
}

interface PlatformPieChartProps {
  tactics: Tactic[]
}

const COLORS = [
  '#1A8A7D', '#C45A2C', '#D4A34A', '#7A94A8', '#4A3728',
  '#2CB5A5', '#D97B56', '#E0BD6E', '#95AEC0', '#6B5444',
]

export function PlatformPieChart({ tactics }: PlatformPieChartProps) {
  const platformMap = new Map<string, number>()
  for (const tactic of tactics) {
    const platform = tactic.platform?.trim() || 'Unassigned'
    platformMap.set(platform, (platformMap.get(platform) ?? 0) + (tactic.budget ?? 0))
  }

  const data = Array.from(platformMap.entries())
    .map(([name, value]) => ({ name, value }))
    .filter((d) => d.value > 0)
    .sort((a, b) => b.value - a.value)

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-sm text-muted-foreground">
        No platform data yet
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
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
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
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 12, color: '#4A3728' }}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
