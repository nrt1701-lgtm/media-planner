import { z } from 'zod'
import { RATE_TYPES, FUNNEL_STAGES } from '@/lib/constants'

// Catches obviously mistyped dates (e.g. a year typed as '0027' instead of
// '2027' into a native date input's year segment) without imposing a strict
// format — a bad year here would otherwise silently stretch date-range
// calculations (like the Reconciliation grid) across centuries.
const plausibleFlightDate = z.string().refine(
  (v) => {
    const year = new Date(v).getUTCFullYear()
    return !isNaN(year) && year >= 1970 && year <= 2100
  },
  { message: 'Flight date must have a year between 1970 and 2100' }
)

export const createTacticSchema = z.object({
  name: z.string().default(''),
  channel: z.string().optional(),
  platform: z.string().optional(),
  placement: z.string().optional(),
  ad_spec_ids: z.array(z.string().uuid()).default([]),
  flight_start: plausibleFlightDate.optional(),
  flight_end: plausibleFlightDate.optional(),
  budget: z.number().min(0).default(0),
  rate_type: z.enum(RATE_TYPES).default('CPM'),
  rate: z.number().min(0).default(0),
  est_impressions: z.number().optional().nullable(),
  landing_page_url: z.string().url().optional().or(z.literal('')).nullable(),
  audience_notes: z.string().optional().nullable(),
  audience_id: z.string().uuid().optional().nullable(),
  funnel_stage: z.enum(FUNNEL_STAGES).optional().nullable(),
  objective: z.string().optional().nullable(),
  sort_order: z.number().int().default(0),
})

// Explicitly define the update schema WITHOUT defaults so that fields absent
// from the PATCH body are undefined (and therefore excluded from Supabase's
// update query). Using createTacticSchema.partial() is unsafe because Zod's
// .partial() may still apply .default() values for absent fields, which would
// silently zero-out columns like `budget` and `rate` whenever only a subset
// of fields (e.g. rate_type) is patched.
export const updateTacticSchema = z.object({
  name: z.string().optional(),
  channel: z.string().optional(),
  platform: z.string().optional(),
  placement: z.string().optional(),
  ad_spec_ids: z.array(z.string().uuid()).optional(),
  flight_start: plausibleFlightDate.optional(),
  flight_end: plausibleFlightDate.optional(),
  budget: z.number().min(0).optional(),
  rate_type: z.enum(RATE_TYPES).optional(),
  rate: z.number().min(0).optional(),
  est_impressions: z.number().optional().nullable(),
  landing_page_url: z.string().url().optional().or(z.literal('')).nullable(),
  audience_notes: z.string().optional().nullable(),
  audience_id: z.string().uuid().optional().nullable(),
  funnel_stage: z.enum(FUNNEL_STAGES).optional().nullable(),
  objective: z.string().optional().nullable(),
  sort_order: z.number().int().optional(),
})
