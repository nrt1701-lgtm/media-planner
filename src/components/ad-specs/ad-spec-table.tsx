'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { useAdSpecs } from '@/hooks/use-ad-specs'
import { AdSpecFormDialog } from './ad-spec-form-dialog'
import { CsvImportDialog } from './csv-import-dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, MoreHorizontal, Search, Upload } from 'lucide-react'

interface AdSpec {
  id: string
  platform: string
  placement: string
  format_name: string
  dimensions?: string | null
  file_types?: string[]
  max_file_size?: string | null
  duration_limits?: string | null
  char_limits?: Record<string, number> | null
  notes?: string | null
}

export function AdSpecTable() {
  const [search, setSearch] = useState('')
  const [platformFilter, setPlatformFilter] = useState<string>('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingSpec, setEditingSpec] = useState<AdSpec | null>(null)
  const [importOpen, setImportOpen] = useState(false)

  const { adSpecs, isLoading, mutate } = useAdSpecs(
    platformFilter !== 'all' ? platformFilter : undefined
  )

  const filtered = (adSpecs as AdSpec[]).filter((spec) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      spec.platform.toLowerCase().includes(q) ||
      spec.placement.toLowerCase().includes(q) ||
      spec.format_name.toLowerCase().includes(q)
    )
  })

  const platforms = Array.from(
    new Set((adSpecs as AdSpec[]).map((s) => s.platform))
  ).sort()

  async function handleDelete(id: string) {
    if (!confirm('Delete this ad spec?')) return
    try {
      const res = await fetch(`/api/ad-specs/${id}`, { method: 'DELETE' })
      if (!res.ok && res.status !== 204) throw new Error('Delete failed')
      toast.success('Ad spec deleted')
      mutate()
    } catch {
      toast.error('Failed to delete ad spec')
    }
  }

  function handleEdit(spec: AdSpec) {
    setEditingSpec(spec)
    setDialogOpen(true)
  }

  function handleAdd() {
    setEditingSpec(null)
    setDialogOpen(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search specs…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={platformFilter} onValueChange={setPlatformFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All platforms" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All platforms</SelectItem>
            {platforms.map((p) => (
              <SelectItem key={p} value={p}>
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button variant="outline" size="sm" onClick={() => setImportOpen(true)} className="flex items-center gap-1.5">
          <Upload className="w-4 h-4" />
          Import CSV
        </Button>
        <Button onClick={handleAdd} size="sm" className="flex items-center gap-1.5">
          <Plus className="w-4 h-4" />
          Add Spec
        </Button>
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted">
              <TableHead className="text-xs font-semibold text-muted-foreground">Platform</TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground">Placement</TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground">Format</TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground">Dimensions</TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground">File Types</TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground">Max Size</TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground">Duration</TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground">Char Limits</TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground">Notes</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 10 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center text-sm text-muted-foreground py-10">
                  {search || platformFilter !== 'all'
                    ? 'No specs match your filters.'
                    : 'No ad specs yet. Click "Add Spec" to get started.'}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((spec) => (
                <TableRow key={spec.id} className="hover:bg-muted/50">
                  <TableCell className="text-sm font-medium text-foreground">{spec.platform}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{spec.placement}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{spec.format_name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{spec.dimensions ?? '—'}</TableCell>
                  <TableCell>
                    {(spec.file_types ?? []).length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {(spec.file_types ?? []).map((ft) => (
                          <Badge key={ft} variant="secondary" className="text-xs px-1.5 py-0">
                            {ft}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{spec.max_file_size ?? '—'}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{spec.duration_limits ?? '—'}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {spec.char_limits && Object.keys(spec.char_limits).length > 0 ? (
                      <span>
                        {Object.entries(spec.char_limits)
                          .map(([k, v]) => `${k}: ${v}`)
                          .join(', ')}
                      </span>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[180px]">
                    {spec.notes ? (
                      <span className="truncate block" title={spec.notes}>{spec.notes}</span>
                    ) : '—'}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(spec)}>
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(spec.id)}
                          className="text-red-600"
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AdSpecFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        spec={editingSpec}
        onSaved={() => mutate()}
      />

      <CsvImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onImported={() => mutate()}
      />
    </div>
  )
}
