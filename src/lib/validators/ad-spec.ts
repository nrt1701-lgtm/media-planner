import { z } from 'zod'

export const createAdSpecSchema = z.object({
  platform: z.string().min(1),
  placement: z.string().min(1),
  format_name: z.string().min(1),
  dimensions: z.string().optional().nullable(),
  file_types: z.array(z.string()).default([]),
  max_file_size: z.string().optional().nullable(),
  duration_limits: z.string().optional().nullable(),
  char_limits: z.record(z.string(), z.number()).optional().nullable(),
  notes: z.string().optional().nullable(),
})

export const updateAdSpecSchema = createAdSpecSchema.partial()
