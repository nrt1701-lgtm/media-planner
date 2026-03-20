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
  '#4F46E5', '#0EA5E9', '#10B981', '#F59E0B', '#EF4444',
  '#8B5CF6', '#EC4899', '#14B8A6', '#F97316', '#6366F1',
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
      <div className="flex items-center justify-center h-40 text-sm text-gray-400">
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
            border: '1px solid #E5E7EB',
            borderRadius: '6px',
            fontSize: 12,
          }}
        />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 12, color: '#374151' }}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
