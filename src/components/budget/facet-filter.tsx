'use client'

import { CheckIcon, PlusCircleIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import type { FacetOption } from '@/lib/budget/filters'

interface FacetFilterProps {
  label: string
  options: FacetOption[]
  selected: string[]
  onToggle: (key: string) => void
  onClear: () => void
  disabled?: boolean
}

function formatCompactCurrency(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return `$${Math.round(n)}`
}

export function FacetFilter({
  label,
  options,
  selected,
  onToggle,
  onClear,
  disabled,
}: FacetFilterProps) {
  const selectedSet = new Set(selected)

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled || options.length === 0}
          className="h-8 border-dashed"
        >
          <PlusCircleIcon className="size-3.5" />
          {label}
          {selectedSet.size > 0 && (
            <>
              <Separator orientation="vertical" className="mx-1 h-4" />
              <Badge className="rounded-sm px-1 font-normal bg-brand-teal/15 text-brand-teal border-transparent">
                {selectedSet.size}
              </Badge>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        <Command>
          <CommandInput placeholder={label} className="h-9" />
          <CommandList>
            <CommandEmpty>No results.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => {
                const isSelected = selectedSet.has(option.key)
                return (
                  <CommandItem
                    key={option.key}
                    value={option.label}
                    onSelect={() => onToggle(option.key)}
                  >
                    <div
                      className={cn(
                        'flex size-4 shrink-0 items-center justify-center rounded-[4px] border border-input',
                        isSelected
                          ? 'bg-brand-teal border-brand-teal text-white'
                          : 'opacity-60 [&_svg]:invisible'
                      )}
                    >
                      <CheckIcon className="size-3" />
                    </div>
                    <span className="truncate">{option.label}</span>
                    <span className="ml-auto shrink-0 pl-2 font-mono text-xs text-muted-foreground tabular-nums">
                      {option.count === 0 ? '—' : formatCompactCurrency(option.budget)}
                    </span>
                  </CommandItem>
                )
              })}
            </CommandGroup>
            {selectedSet.size > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    onSelect={onClear}
                    className="justify-center text-center text-xs text-muted-foreground"
                  >
                    Clear {label.toLowerCase()} filter
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
