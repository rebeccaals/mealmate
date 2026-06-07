import { z } from 'zod'

export const CategorySchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
})

export const CategoryRequestSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
})

export type Category = z.infer<typeof CategorySchema>
export type CategoryRequest = z.infer<typeof CategoryRequestSchema>
