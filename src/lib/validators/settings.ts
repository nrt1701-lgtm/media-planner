import { z } from 'zod'

export const updateSettingsSchema = z.object({
  agency_name: z.string().optional(),
  agency_logo_url: z.string().url().optional().or(z.literal('')).nullable(),
  io_terms_template: z.string().optional(),
  creative_lead_time_days: z.number().int().min(1).optional(),
  default_utm_template_id: z.string().uuid().optional().nullable(),
})
