import { z } from 'zod'
import { CAMPAIGN_STATUSES } from '@/lib/constants'

export const createCampaignSchema = z.object({
  client_id: z.string().uuid(),
  name: z.string().min(1, 'Campaign name is required'),
  expense_number: z.string().min(1, 'Expense number is required'),
  total_budget: z.number().min(0).default(0),
  default_landing_page: z.string().url().optional().or(z.literal('')),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().min(1, 'End date is required'),
  status: z.enum(CAMPAIGN_STATUSES).default('draft'),
})

export const updateCampaignSchema = createCampaignSchema.partial()
