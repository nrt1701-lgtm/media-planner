'use client'

import { useState } from 'react'
import { useUtmTemplates } from '@/hooks/use-utm-templates'
import { UtmTemplateEditor } from '@/components/utm/utm-template-editor'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface UtmTemplate {
  id: string
  name: string
  client_id?: string | null
  source_pattern: string
  medium_pattern: string
  campaign_pattern: string
  content_pattern: string
  term_pattern?: string | null
}

export default function UtmTemplatesPage() {
  const { templates, isLoading, mutate } = useUtmTemplates()
  const [selected, setSelected] = useState<UtmTemplate | null>(null)
  const [creating, setCreating] = useState(false)

  const list = templates as UtmTemplate[]

  function handleSelect(t: UtmTemplate) {
    setCreating(false)
    setSelected(t)
  }

  function handleCreate() {
    setSelected(null)
    setCreating(true)
  }

  function handleSaved() {
    mutate()
    if (creating) setCreating(false)
  }

  function handleDeleted() {
    mutate()
    setSelected(null)
  }

  return (
    <div className="flex h-full">
      {/* Sidebar list */}
      <div className="w-64 flex-shrink-0 border-r border-gray-200 bg-white flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-900">UTM Templates</h2>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {isLoading ? (
            <div className="space-y-2 p-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-9 w-full" />
              ))}
            </div>
          ) : list.length === 0 ? (
            <p className="text-xs text-gray-400 px-3 py-4">No templates yet.</p>
          ) : (
            list.map((t) => (
              <button
                key={t.id}
                onClick={() => handleSelect(t)}
                className={cn(
                  'w-full text-left px-3 py-2 rounded-md text-sm transition-colors',
                  selected?.id === t.id
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-100'
                )}
              >
                {t.name}
              </button>
            ))
          )}
        </div>

        <div className="p-3 border-t border-gray-200">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCreate}
            className="w-full flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            New Template
          </Button>
        </div>
      </div>

      {/* Editor panel */}
      <div className="flex-1 overflow-auto p-8">
        {creating ? (
          <div>
            <div className="mb-6">
              <h1 className="text-xl font-bold text-gray-900">New UTM Template</h1>
              <p className="text-sm text-gray-500 mt-1">
                Define patterns for auto-generating UTM parameters.
              </p>
            </div>
            <UtmTemplateEditor onSaved={handleSaved} />
          </div>
        ) : selected ? (
          <div>
            <div className="mb-6">
              <h1 className="text-xl font-bold text-gray-900">{selected.name}</h1>
              <p className="text-sm text-gray-500 mt-1">
                Edit this template&apos;s UTM patterns.
              </p>
            </div>
            <UtmTemplateEditor
              key={selected.id}
              template={selected}
              onSaved={handleSaved}
              onDeleted={handleDeleted}
            />
          </div>
        ) : (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-4">
                Select a template to edit, or create a new one.
              </p>
              <Button onClick={handleCreate} variant="outline">
                <Plus className="w-4 h-4 mr-1.5" />
                New Template
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
