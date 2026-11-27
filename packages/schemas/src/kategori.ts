import { z } from 'zod'

export const KategoriSchema = z.object({
  id: z.string().uuid(),
  navn: z.string().min(1),
})

export const KategoriRequestSchema = z.object({
  navn: z.string().min(1, 'Navn må fylles ut').max(100),
})

export type Kategori = z.infer<typeof KategoriSchema>
export type KategoriRequest = z.infer<typeof KategoriRequestSchema>
