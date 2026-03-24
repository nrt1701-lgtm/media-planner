'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface LogoUploadProps {
  value: string
  onChange: (url: string) => void
}

export function LogoUpload({ value, onChange }: LogoUploadProps) {
  return (
    <div className="space-y-3">
      <Label htmlFor="logo-url">Agency Logo URL</Label>
      <Input
        id="logo-url"
        type="url"
        placeholder="https://example.com/logo.png"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {value && (
        <div className="mt-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt="Agency logo preview"
            className="h-16 w-auto max-w-xs rounded border border-border object-contain p-1"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = 'none'
            }}
          />
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        Enter a URL to your agency logo. It will appear on generated IO PDFs.
      </p>
    </div>
  )
}
