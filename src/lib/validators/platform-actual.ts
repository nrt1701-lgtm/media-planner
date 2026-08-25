import { z } from 'zod'

export const upsertPlatformActualSchema = z.object({
  platform: z.string().min(1),
  month: z.string().regex(/^\d{4}-\d{2}-01$/, 'month must be the first day of the month (YYYY-MM-01)'),
  actual_spend: z.number().min(0),
})
