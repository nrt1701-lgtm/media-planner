'use client'

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

export type CostView = 'net' | 'gross'

interface CostViewToggleProps {
  value: CostView
  onChange: (value: CostView) => void
  className?: string
}

export function CostViewToggle({ value, onChange, className }: CostViewToggleProps) {
  return (
    <Tabs value={value} onValueChange={(v) => onChange(v as CostView)} className={className}>
      <TabsList className="h-7 bg-muted p-0.5 gap-0">
        <TabsTrigger value="net" className="h-6 px-2.5 text-xs data-[state=active]:bg-card">
          Net
        </TabsTrigger>
        <TabsTrigger value="gross" className="h-6 px-2.5 text-xs data-[state=active]:bg-card">
          Gross
        </TabsTrigger>
      </TabsList>
    </Tabs>
  )
}
