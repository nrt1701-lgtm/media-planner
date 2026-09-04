'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PIVOT_DIMENSIONS, type PivotDimension } from '@/lib/budget/filters'

interface GroupBySelectProps {
  value: PivotDimension
  onChange: (value: PivotDimension) => void
}

export function GroupBySelect({ value, onChange }: GroupBySelectProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">Group by</span>
      <Select value={value} onValueChange={(v) => onChange(v as PivotDimension)}>
        <SelectTrigger className="h-8 w-[150px] text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {PIVOT_DIMENSIONS.map((dimension) => (
            <SelectItem key={dimension.value} value={dimension.value}>
              {dimension.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
