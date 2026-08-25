'use client'

import { useRef, forwardRef, useImperativeHandle } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FUNNEL_STAGES, type FunnelStage } from '@/lib/constants'
import type { CellHandle } from './inline-cell'

interface FunnelStageSelectProps {
  value: FunnelStage | null | undefined
  onSave: (value: FunnelStage) => void
  onTab?: () => void
  onShiftTab?: () => void
}

export const FunnelStageSelect = forwardRef<CellHandle, FunnelStageSelectProps>(function FunnelStageSelect(
  { value, onSave, onTab, onShiftTab },
  ref,
) {
  const triggerRef = useRef<HTMLButtonElement>(null)

  useImperativeHandle(ref, () => ({
    focus: () => triggerRef.current?.focus(),
  }))

  return (
    <Select
      value={value ?? ''}
      onValueChange={(v) => onSave(v as FunnelStage)}
    >
      <SelectTrigger
        ref={triggerRef}
        onKeyDown={(e) => {
          if (e.key === 'Tab') {
            e.preventDefault()
            if (e.shiftKey) onShiftTab?.()
            else onTab?.()
          }
        }}
        className="h-7 w-full min-w-[100px] border-transparent bg-transparent hover:bg-brand-teal/10 hover:border-brand-teal/30 text-sm px-1.5 focus:ring-2 focus:ring-brand-teal/30"
      >
        <SelectValue placeholder={<span className="text-muted-foreground">—</span>} />
      </SelectTrigger>
      <SelectContent>
        {FUNNEL_STAGES.map((stage) => (
          <SelectItem key={stage} value={stage}>
            {stage}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
})
