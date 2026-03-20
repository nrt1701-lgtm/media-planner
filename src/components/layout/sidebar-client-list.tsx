'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight, Plus, Search } from 'lucide-react'
import { useClients } from '@/hooks/use-clients'
import { SidebarCampaignList } from './sidebar-campaign-list'
import { CreateClientDialog } from '@/components/clients/create-client-dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

interface Client {
  id: string
  name: string
  client_code: string
  industry?: string
}

export function SidebarClientList() {
  const { clients, isLoading, mutate } = useClients()
  const [search, setSearch] = useState('')
  const [expandedClientId, setExpandedClientId] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

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
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search clients…"
            className="h-8 pl-8 text-xs bg-gray-50 border-gray-200"
          />
        </div>
      </div>

      {/* Client list */}
      <div className="flex-1">
        {isLoading ? (
          <div className="px-3 space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-8 w-full rounded-md" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-4 py-3">
            <p className="text-xs text-gray-400 italic">
              {search ? 'No clients match your search' : 'No clients yet'}
            </p>
          </div>
        ) : (
          <ul className="space-y-0.5 px-2">
            {filtered.map((client) => (
              <li key={client.id}>
                <button
                  onClick={() => toggleClient(client.id)}
                  className="flex items-center gap-2 w-full px-3 py-2 rounded-md text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors text-left"
                >
                  {expandedClientId === client.id ? (
                    <ChevronDown className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" />
                  )}
                  <span className="truncate font-medium">{client.name}</span>
                  <span className="ml-auto text-xs text-gray-400 font-mono flex-shrink-0">
                    {client.client_code}
                  </span>
                </button>

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
          className="w-full h-8 text-xs text-gray-600 border-dashed border-gray-300 hover:border-blue-400 hover:text-blue-600 justify-center gap-1.5"
          onClick={() => setDialogOpen(true)}
        >
          <Plus className="w-3.5 h-3.5" />
          New Client
        </Button>
      </div>

      <CreateClientDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={mutate}
      />
    </div>
  )
}
