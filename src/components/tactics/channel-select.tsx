'use client'

import { useChannels } from '@/hooks/use-channels'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Channel {
  id: string
  name: string
}

interface ChannelSelectProps {
  value: string | null | undefined
  onSave: (value: string) => Promise<void> | void
}

export function ChannelSelect({ value, onSave }: ChannelSelectProps) {
  const { channels } = useChannels()

  return (
    <Select
      value={value ?? ''}
      onValueChange={(v) => onSave(v)}
    >
      <SelectTrigger className="h-7 w-full min-w-[100px] border-transparent bg-transparent hover:bg-blue-50 hover:border-blue-200 text-sm px-1.5 focus:ring-2 focus:ring-blue-200">
        <SelectValue placeholder={<span className="text-gray-400">—</span>} />
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
}
