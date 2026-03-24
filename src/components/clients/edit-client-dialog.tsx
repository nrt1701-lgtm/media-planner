'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'

interface Client {
  id: string
  name: string
  client_code: string
  industry?: string | null
}

interface EditClientDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  client: Client
  onSuccess: () => void
  onDeleted?: () => void
}

export function EditClientDialog({
  open,
  onOpenChange,
  client,
  onSuccess,
  onDeleted,
}: EditClientDialogProps) {
  const [name, setName] = useState(client.name)
  const [clientCode, setClientCode] = useState(client.client_code)
  const [industry, setIndustry] = useState(client.industry ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Reset form when dialog opens with new client data
  useEffect(() => {
    if (open) {
      setName(client.name)
      setClientCode(client.client_code)
      setIndustry(client.industry ?? '')
      setError(null)
      setConfirmDelete(false)
    }
  }, [open, client])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const res = await fetch(`/api/clients/${client.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          client_code: clientCode,
          industry: industry || undefined,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data?.error?.formErrors?.[0] ?? data?.error ?? 'Failed to update client')
      }

      toast.success('Client saved')
      onSuccess()
      onOpenChange(false)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong'
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }

    setDeleting(true)
    try {
      const res = await fetch(`/api/clients/${client.id}`, { method: 'DELETE' })

      if (!res.ok) {
        const data = await res.json()
        const msg = data?.error ?? 'Failed to delete client'
        setError(msg)
        toast.error(msg)
        setConfirmDelete(false)
        return
      }

      toast.success('Client deleted')
      onOpenChange(false)
      onDeleted?.()
    } catch {
      const msg = 'Something went wrong while deleting'
      setError(msg)
      toast.error(msg)
      setConfirmDelete(false)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Client</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-client-name">Client Name</Label>
            <Input
              id="edit-client-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Acme Corporation"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-client-code">Client Code</Label>
            <Input
              id="edit-client-code"
              value={clientCode}
              onChange={(e) => setClientCode(e.target.value.toUpperCase())}
              placeholder="ACME"
              maxLength={10}
              required
            />
            <p className="text-xs text-muted-foreground">Short code used in Workamajig (max 10 chars)</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-client-industry">Industry</Label>
            <Input
              id="edit-client-industry"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              placeholder="Retail, Healthcare, Finance…"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading || deleting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || deleting}>
              {loading ? 'Saving…' : 'Save Client'}
            </Button>
          </DialogFooter>
        </form>

        <Separator />

        {/* Delete zone */}
        <div className="pt-1">
          {confirmDelete ? (
            <div className="space-y-2">
              <p className="text-sm text-red-600 font-medium">
                Are you sure? This cannot be undone.
              </p>
              <p className="text-xs text-muted-foreground">
                Clients with active campaigns cannot be deleted.
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? 'Deleting…' : 'Yes, delete'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setConfirmDelete(false)}
                  disabled={deleting}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-red-600 hover:text-red-700 hover:bg-red-50 px-0"
              onClick={handleDelete}
            >
              Delete client…
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
