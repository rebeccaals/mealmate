import { z } from 'zod'
import { AvdelingSchema } from './ingrediens'

export const ButikkvareSchema = z.object({
  id: z.string().uuid(),
  navn: z.string(),
  avdeling: AvdelingSchema,
  /** How many oppskrifter use it — a butikkvare in use can't be deleted, only merged */
  antallOppskrifter: z.number(),
})

/** Bulk create; names that already exist (ignoring case) are skipped */
export const CreateButikkvarerRequestSchema = z.object({
  navn: z.array(z.string().min(1).max(100)).min(1),
  avdeling: AvdelingSchema,
})

export const UpdateButikkvareRequestSchema = z.object({
  navn: z.string().min(1, 'Navn må fylles ut').max(100),
  avdeling: AvdelingSchema,
})

export type Butikkvare = z.infer<typeof ButikkvareSchema>
export type CreateButikkvarerRequest = z.infer<typeof CreateButikkvarerRequestSchema>
export type UpdateButikkvareRequest = z.infer<typeof UpdateButikkvareRequestSchema>
