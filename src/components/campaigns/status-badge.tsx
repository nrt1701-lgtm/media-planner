import { Badge } from '@/components/ui/badge'
import { STATUS_COLORS, type CampaignStatus } from '@/lib/constants'

interface StatusBadgeProps {
  status: CampaignStatus
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={`text-xs font-medium border-0 ${STATUS_COLORS[status]}`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  )
}
