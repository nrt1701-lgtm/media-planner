'use client'

import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react'
import { cn } from '@/lib/utils'

export type CellHandle = { focus: () => void }

type InlineCellVariant = 'text' | 'number' | 'date'

interface InlineCellProps {
  value: string | number | null | undefined
  variant?: InlineCellVariant
  placeholder?: string
  className?: string
  onSave: (value: string) => Promise<void> | void
  displayFormat?: (value: string | number | null | undefined) => string | null
  onTab?: () => void
  onShiftTab?: () => void
}

export const InlineCell = forwardRef<CellHandle, InlineCellProps>(function InlineCell({
  value,
  variant = 'text',
  placeholder = '—',
  className,
  onSave,
  displayFormat,
  onTab,
  onShiftTab,
}, ref) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useImperativeHandle(ref, () => ({ focus: startEdit }))

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editing])

  function startEdit() {
    const raw = value == null ? '' : String(value)
    setDraft(raw)
    setEditing(true)
  }

  async function commit() {
    if (!editing) return
    setEditing(false)
    const trimmed = draft.trim()
    const original = value == null ? '' : String(value)
    if (trimmed === original) return
    setSaving(true)
    try {
      await onSave(trimmed)
    } finally {
      setSaving(false)
    }
  }

  function cancel() {
    setEditing(false)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Tab') {
      e.preventDefault()
      commit()
      if (e.shiftKey) onShiftTab?.()
      else onTab?.()
    } else if (e.key === 'Enter') {
      e.preventDefault()
      commit()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      cancel()
    }
  }

  const displayValue = displayFormat ? displayFormat(value) : (value == null || value === '' ? null : String(value))

  if (editing) {
    return (
      <input
        ref={inputRef}
        type={variant === 'number' ? 'number' : variant === 'date' ? 'date' : 'text'}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        className={cn(
          'w-full min-w-[80px] rounded border border-blue-400 bg-white px-1.5 py-0.5 text-sm outline-none ring-2 ring-blue-200',
          className
        )}
      />
    )
  }

  return (
    <button
      type="button"
      onClick={startEdit}
      disabled={saving}
      className={cn(
        'w-full text-left rounded px-1.5 py-0.5 text-sm hover:bg-blue-50 hover:ring-1 hover:ring-blue-200 transition-colors cursor-text',
        saving && 'opacity-50',
        className
      )}
    >
      {displayValue ?? <span className="text-gray-400">{placeholder}</span>}
    </button>
  )
})
