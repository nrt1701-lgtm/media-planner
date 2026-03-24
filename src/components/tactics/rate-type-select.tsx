'use client'

import { useRef, forwardRef, useImperativeHandle } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RATE_TYPES, type RateType } from '@/lib/constants'
import type { CellHandle } from './inline-cell'

interface RateTypeSelectProps {
  value: RateType | null | undefined
  onSave: (value: RateType) => void
  onTab?: () => void
  onShiftTab?: () => void
}

export const RateTypeSelect = forwardRef<CellHandle, RateTypeSelectProps>(function RateTypeSelect(
  { value, onSave, onTab, onShiftTab },
  ref,
) {
  const triggerRef = useRef<HTMLButtonElement>(null)

  useImperativeHandle(ref, () => ({
    focus: () => triggerRef.current?.focus(),
  }))

  return (
    <Select
      value={value ?? 'CPM'}
      onValueChange={(v) => onSave(v as RateType)}
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
        className="h-7 w-full border-transparent bg-transparent hover:bg-brand-teal/10 hover:border-brand-teal/30 text-sm px-1.5 focus:ring-2 focus:ring-brand-teal/30"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {RATE_TYPES.map((rt) => (
          <SelectItem key={rt} value={rt}>
            {rt}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
})
