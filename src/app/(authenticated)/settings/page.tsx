import { AgencySettingsForm } from '@/components/settings/agency-settings-form'

export default function SettingsPage() {
  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Agency Settings</h1>
        <p className="text-sm text-gray-500 mt-1">
          Configure your agency information and document defaults.
        </p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <AgencySettingsForm />
      </div>
    </div>
  )
}
