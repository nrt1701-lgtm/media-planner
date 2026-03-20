import { z } from 'zod'

export const createClientSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  client_code: z.string().min(1, 'Client code is required').max(10),
  industry: z.string().optional(),
})

export const updateClientSchema = createClientSchema.partial()
