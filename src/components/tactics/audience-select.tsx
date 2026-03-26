'use client'

import { useRef, forwardRef, useImperativeHandle } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { CellHandle } from './inline-cell'
import type { Audience } from '@/hooks/use-audiences'

interface AudienceSelectProps {
  audiences: Audience[]
  value: string | null | undefined
  onSave: (id: string | null) => void
  onTab?: () => void
  onShiftTab?: () => void
}

export const AudienceSelect = forwardRef<CellHandle, AudienceSelectProps>(
  function AudienceSelect({ audiences, value, onSave, onTab, onShiftTab }, ref) {
    const triggerRef = useRef<HTMLButtonElement>(null)

    useImperativeHandle(ref, () => ({
      focus: () => triggerRef.current?.focus(),
    }))

    return (
      <Select
        value={value ?? '__none__'}
        onValueChange={(v) => onSave(v === '__none__' ? null : v)}
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
          <SelectValue placeholder="— None —" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__none__">— None —</SelectItem>
          {audiences.map((a) => (
            <SelectItem key={a.id} value={a.id}>
              {a.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )
  }
)
