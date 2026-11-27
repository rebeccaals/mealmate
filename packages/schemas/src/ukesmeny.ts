import { z } from 'zod'

// Mirrors .NET's System.DayOfWeek, which the API serializes as English names
export const DayOfWeekSchema = z.enum([
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
])

export const MåltidstypeSchema = z.enum(['Frokost', 'Lunsj', 'Middag'])

export const AddMåltidRequestSchema = z.object({
  dag: DayOfWeekSchema,
  måltidstype: MåltidstypeSchema,
  oppskriftId: z.string().uuid(),
})

// Response types — what the API returns
export const MåltidResponseSchema = z.object({
  id: z.string().uuid(),
  dag: DayOfWeekSchema,
  måltidstype: MåltidstypeSchema,
  oppskriftId: z.string().uuid(),
  oppskriftTittel: z.string(),
})

export const UkesmenyResponseSchema = z.object({
  ukestart: z.string().date(),
  måltider: z.array(MåltidResponseSchema),
})

export type DayOfWeek = z.infer<typeof DayOfWeekSchema>
export type Måltidstype = z.infer<typeof MåltidstypeSchema>
export type AddMåltidRequest = z.infer<typeof AddMåltidRequestSchema>
export type MåltidResponse = z.infer<typeof MåltidResponseSchema>
export type UkesmenyResponse = z.infer<typeof UkesmenyResponseSchema>
