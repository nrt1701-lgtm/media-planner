'use client'

import Link from 'next/link'
import { LayoutGrid, FileText, Settings } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { SidebarClientList } from './sidebar-client-list'

export function Sidebar() {
  return (
    <aside className="flex flex-col w-[280px] min-w-[280px] h-screen bg-white border-r border-gray-200 shadow-sm">
      {/* Logo / App name */}
      <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-200">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-600">
          <LayoutGrid className="w-4 h-4 text-white" />
        </div>
        <span className="text-base font-semibold text-gray-900 tracking-tight">
          Media Planner
        </span>
      </div>

      {/* Scrollable nav area */}
      <div className="flex-1 overflow-y-auto py-3">
        <SidebarClientList />
      </div>

      {/* Footer links */}
      <div className="border-t border-gray-200">
        <Separator />
        <nav className="flex flex-col gap-0.5 p-2">
          <Link
            href="/settings"
            className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
          >
            <Settings className="w-4 h-4 flex-shrink-0" />
            Settings
          </Link>
          <Link
            href="/ad-specs"
            className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
          >
            <FileText className="w-4 h-4 flex-shrink-0" />
            Ad Spec Library
          </Link>
        </nav>
      </div>
    </aside>
  )
}
