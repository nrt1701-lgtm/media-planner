import { z } from 'zod'

export const audienceStrategySchema = z.object({
  demographics: z.object({
    age_range: z.string().default(''),
    gender: z.string().default(''),
    hhi: z.string().default(''),
    education: z.string().default(''),
  }).default({ age_range: '', gender: '', hhi: '', education: '' }),
  geographic: z.object({
    scope: z.enum(['national', 'local']).default('national'),
    markets: z.array(z.string()).default([]),
    states: z.array(z.string()).default([]),
  }).default({ scope: 'national', markets: [], states: [] }),
  behavioral: z.object({
    segments: z.array(z.string()).default([]),
    interests: z.array(z.string()).default([]),
  }).default({ segments: [], interests: [] }),
  custom_notes: z.string().default(''),
}).default({
  demographics: { age_range: '', gender: '', hhi: '', education: '' },
  geographic: { scope: 'national', markets: [], states: [] },
  behavioral: { segments: [], interests: [] },
  custom_notes: '',
})

export const updateMediaPlanSchema = z.object({
  audience_strategy: audienceStrategySchema.optional(),
  notes: z.string().optional().nullable(),
  prepared_by: z.string().optional().nullable(),
})
