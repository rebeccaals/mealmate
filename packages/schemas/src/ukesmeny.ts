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

export const MåltidstypeSchema = z.enum(['Frokost', 'Lunsj', 'Middag', 'Kvelds'])

export const STANDARD_PORSJONER = 2

// Replaces the whole måltid. No oppskrifter and no notat removes it.
export const SaveMåltidRequestSchema = z.object({
  porsjoner: z.number().int().min(1).max(50),
  notat: z.string().max(200).nullable(),
  oppskriftIder: z.array(z.string().uuid()),
})

// Response types — what the API returns
export const MåltidResponseSchema = z.object({
  id: z.string().uuid(),
  dag: DayOfWeekSchema,
  måltidstype: MåltidstypeSchema,
  porsjoner: z.number(),
  notat: z.string().nullable(),
  oppskrifter: z.array(z.object({
    id: z.string().uuid(),
    tittel: z.string(),
  })),
})

export const UkesmenyResponseSchema = z.object({
  ukestart: z.string().date(),
  måltider: z.array(MåltidResponseSchema),
})

export type DayOfWeek = z.infer<typeof DayOfWeekSchema>
export type Måltidstype = z.infer<typeof MåltidstypeSchema>
export type SaveMåltidRequest = z.infer<typeof SaveMåltidRequestSchema>
export type MåltidResponse = z.infer<typeof MåltidResponseSchema>
export type UkesmenyResponse = z.infer<typeof UkesmenyResponseSchema>
