import { z } from 'zod'

const GENDER_VALUES = ['', 'Male', 'Female'] as const
const SCOPE_VALUES = ['national', 'local'] as const

const demographicsSchema = z.object({
  age_range: z.string().default(''),
  gender: z.enum(GENDER_VALUES).default(''),
  hhi: z.string().default(''),
  education: z.string().default(''),
}).default({ age_range: '', gender: '', hhi: '', education: '' })

const geographicSchema = z.object({
  scope: z.enum(SCOPE_VALUES).default('national'),
  markets: z.array(z.string()).default([]),
  states: z.array(z.string()).default([]),
}).default({ scope: 'national', markets: [], states: [] })

const behavioralSchema = z.object({
  segments: z.array(z.string()).default([]),
  interests: z.array(z.string()).default([]),
}).default({ segments: [], interests: [] })

const audienceStrategySchema = z.object({
  demographics: demographicsSchema,
  geographic: geographicSchema,
  behavioral: behavioralSchema,
  custom_notes: z.string().default(''),
}).default({
  demographics: { age_range: '', gender: '', hhi: '', education: '' },
  geographic: { scope: 'national', markets: [], states: [] },
  behavioral: { segments: [], interests: [] },
  custom_notes: '',
})

export const createAudienceSchema = z.object({
  name: z.string().default('New Audience'),
  audience_strategy: audienceStrategySchema,
  sort_order: z.number().int().default(0),
})
