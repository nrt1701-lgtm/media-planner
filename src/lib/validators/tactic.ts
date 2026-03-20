import { z } from 'zod'
import { RATE_TYPES } from '@/lib/constants'

export const createTacticSchema = z.object({
  name: z.string().default(''),
  channel: z.string().optional(),
  platform: z.string().optional(),
  placement: z.string().optional(),
  ad_spec_ids: z.array(z.string().uuid()).default([]),
  flight_start: z.string().optional(),
  flight_end: z.string().optional(),
  budget: z.number().min(0).default(0),
  rate_type: z.enum(RATE_TYPES).default('CPM'),
  rate: z.number().min(0).default(0),
  est_impressions: z.number().optional().nullable(),
  landing_page_url: z.string().url().optional().or(z.literal('')).nullable(),
  audience_notes: z.string().optional(),
  sort_order: z.number().int().default(0),
})

export const updateTacticSchema = createTacticSchema.partial()
