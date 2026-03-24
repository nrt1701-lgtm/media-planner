'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight, Plus, Search, MoreHorizontal, Pencil } from 'lucide-react'
import { useClients } from '@/hooks/use-clients'
import { SidebarCampaignList } from './sidebar-campaign-list'
import { CreateClientDialog } from '@/components/clients/create-client-dialog'
import { EditClientDialog } from '@/components/clients/edit-client-dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface Client {
  id: string
  name: string
  client_code: string
  industry?: string | null
}

export function SidebarClientList() {
  const { clients, isLoading, mutate } = useClients()
  const [search, setSearch] = useState('')
  const [expandedClientId, setExpandedClientId] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)

  const filtered = (clients as Client[]).filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.client_code.toLowerCase().includes(search.toLowerCase())
  )

  function toggleClient(id: string) {
    setExpandedClientId((prev) => (prev === id ? null : id))
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Search */}
      <div className="px-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search clients…"
            className="h-8 pl-8 text-xs bg-muted border-border"
          />
        </div>
      </div>

      {/* Client list */}
      <div className="flex-1">
        {isLoading ? (
          <div className="px-3 space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-8 w-full rounded-md" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-4 py-4">
            <p className="text-xs text-muted-foreground italic">
              {search
                ? 'No clients match your search'
                : 'No clients yet. Create your first client to get started.'}
            </p>
          </div>
        ) : (
          <ul className="space-y-0.5 px-2">
            {filtered.map((client) => (
              <li key={client.id}>
                <div className="group flex items-center gap-1 w-full">
                  <button
                    onClick={() => toggleClient(client.id)}
                    className="flex items-center gap-2 flex-1 min-w-0 px-3 py-2 rounded-md text-sm text-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors text-left"
                  >
                    {expandedClientId === client.id ? (
                      <ChevronDown className="w-3.5 h-3.5 flex-shrink-0 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 flex-shrink-0 text-muted-foreground" />
                    )}
                    <span className="truncate font-medium">{client.name}</span>
                    <span className="ml-auto text-xs text-muted-foreground font-mono flex-shrink-0">
                      {client.client_code}
                    </span>
                  </button>

                  {/* Three-dot menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 focus-within:opacity-100 flex-shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal className="w-3.5 h-3.5" />
                        <span className="sr-only">Client options</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-36">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          setEditingClient(client)
                        }}
                      >
                        <Pencil className="w-3.5 h-3.5 mr-2" />
                        Edit
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {expandedClientId === client.id && (
                  <SidebarCampaignList client={client} />
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* New Client button */}
      <div className="px-3">
        <Button
          variant="outline"
          size="sm"
          className="w-full h-8 text-xs text-muted-foreground border-dashed border-border hover:border-brand-teal hover:text-brand-teal justify-center gap-1.5"
          onClick={() => setCreateOpen(true)}
        >
          <Plus className="w-3.5 h-3.5" />
          New Client
        </Button>
      </div>

      <CreateClientDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={mutate}
      />

      {editingClient && (
        <EditClientDialog
          open={!!editingClient}
          onOpenChange={(open) => { if (!open) setEditingClient(null) }}
          client={editingClient}
          onSuccess={mutate}
          onDeleted={() => {
            mutate()
            if (expandedClientId === editingClient.id) setExpandedClientId(null)
          }}
        />
      )}
    </div>
  )
}
