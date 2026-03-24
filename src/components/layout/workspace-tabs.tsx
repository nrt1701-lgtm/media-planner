'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface WorkspaceTabsProps {
  tacticsContent?: React.ReactNode
  audienceContent?: React.ReactNode
  budgetContent?: React.ReactNode
  documentsContent?: React.ReactNode
}

export function WorkspaceTabs({
  tacticsContent,
  audienceContent,
  budgetContent,
  documentsContent,
}: WorkspaceTabsProps) {
  return (
    <Tabs defaultValue="tactics" className="flex flex-col h-full">
      <div className="border-b border-border bg-card px-6">
        <TabsList className="h-auto bg-transparent p-0 gap-0">
          {[
            { value: 'tactics', label: 'Tactics' },
            { value: 'audience', label: 'Audience' },
            { value: 'budget', label: 'Budget Summary' },
            { value: 'documents', label: 'Generate Documents' },
          ].map(({ value, label }) => (
            <TabsTrigger
              key={value}
              value={value}
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-brand-teal data-[state=active]:text-brand-teal data-[state=active]:shadow-none bg-transparent px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      <TabsContent value="tactics" className="flex-1 m-0 overflow-auto">
        {tacticsContent ?? (
          <div className="p-6">
            <p className="text-sm text-muted-foreground">No tactics yet.</p>
          </div>
        )}
      </TabsContent>

      <TabsContent value="audience" className="flex-1 m-0 overflow-auto">
        {audienceContent ?? (
          <div className="p-6">
            <p className="text-sm text-muted-foreground">Audience details coming soon.</p>
          </div>
        )}
      </TabsContent>

      <TabsContent value="budget" className="flex-1 m-0 overflow-auto">
        {budgetContent ?? (
          <div className="p-6">
            <p className="text-sm text-muted-foreground">Budget summary coming soon.</p>
          </div>
        )}
      </TabsContent>

      <TabsContent value="documents" className="flex-1 m-0 overflow-auto">
        {documentsContent ?? (
          <div className="p-6">
            <p className="text-sm text-muted-foreground">Document generation coming soon.</p>
          </div>
        )}
      </TabsContent>
    </Tabs>
  )
}
