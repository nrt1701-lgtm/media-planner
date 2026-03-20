import { z } from 'zod'

export const createUtmTemplateSchema = z.object({
  client_id: z.string().uuid().optional().nullable(),
  name: z.string().min(1).default('Default'),
  source_pattern: z.string().min(1),
  medium_pattern: z.string().min(1),
  campaign_pattern: z.string().min(1),
  content_pattern: z.string().min(1),
  term_pattern: z.string().optional().nullable(),
})

export const updateUtmTemplateSchema = createUtmTemplateSchema.partial()
