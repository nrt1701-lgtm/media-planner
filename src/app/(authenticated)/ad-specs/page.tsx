import { AdSpecTable } from '@/components/ad-specs/ad-spec-table'

export default function AdSpecsPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Ad Spec Library</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage creative specifications by platform and placement.
        </p>
      </div>

      <AdSpecTable />
    </div>
  )
}
