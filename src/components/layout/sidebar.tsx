'use client'

import Link from 'next/link'
import { LayoutGrid, FileText, Settings, Link2 } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { SidebarClientList } from './sidebar-client-list'

export function Sidebar() {
  return (
    <aside className="flex flex-col w-[280px] min-w-[280px] h-screen bg-sidebar border-r border-sidebar-border shadow-sm">
      {/* Logo / App name */}
      <div className="flex items-center gap-2 px-5 py-4 border-b border-sidebar-border">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-brand-teal">
          <LayoutGrid className="w-4 h-4 text-white" />
        </div>
        <span className="text-base font-semibold text-sidebar-foreground tracking-tight">
          Media Planner
        </span>
      </div>

      {/* Scrollable nav area */}
      <div className="flex-1 overflow-y-auto py-3">
        <SidebarClientList />
      </div>

      {/* Footer links */}
      <div className="border-t border-sidebar-border">
        <Separator />
        <nav className="flex flex-col gap-0.5 p-2">
          <Link
            href="/settings"
            className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
          >
            <Settings className="w-4 h-4 flex-shrink-0" />
            Settings
          </Link>
          <Link
            href="/ad-specs"
            className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
          >
            <FileText className="w-4 h-4 flex-shrink-0" />
            Ad Spec Library
          </Link>
          <Link
            href="/utm-templates"
            className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
          >
            <Link2 className="w-4 h-4 flex-shrink-0" />
            UTM Templates
          </Link>
        </nav>
      </div>
    </aside>
  )
}
