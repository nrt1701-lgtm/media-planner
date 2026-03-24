'use client'

import { useRef, forwardRef, useImperativeHandle } from 'react'
import { useChannels } from '@/hooks/use-channels'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { CellHandle } from './inline-cell'

interface Channel {
  id: string
  name: string
}

interface ChannelSelectProps {
  value: string | null | undefined
  onSave: (value: string) => Promise<void> | void
  onTab?: () => void
  onShiftTab?: () => void
}

export const ChannelSelect = forwardRef<CellHandle, ChannelSelectProps>(function ChannelSelect(
  { value, onSave, onTab, onShiftTab },
  ref,
) {
  const { channels } = useChannels()
  const triggerRef = useRef<HTMLButtonElement>(null)

  useImperativeHandle(ref, () => ({
    focus: () => triggerRef.current?.focus(),
  }))

  return (
    <Select
      value={value ?? ''}
      onValueChange={(v) => onSave(v)}
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
        {channels.map((ch: Channel) => (
          <SelectItem key={ch.id} value={ch.name}>
            {ch.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
})
