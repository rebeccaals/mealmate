import { z } from 'zod'
import { KategoriSchema } from './kategori'
import { AvdelingSchema, EnhetSchema } from './ingrediens'

// One ingrediens as sent to the API. The butikkvare is given by name: an existing one is reused
// (ignoring case), otherwise it's created with `avdeling` (or Annet).
export const IngrediensRequestSchema = z.object({
  butikkvareNavn: z.string().min(1).max(100),
  avdeling: AvdelingSchema.nullable(),
  mengde: z.number().positive().nullable(),
  enhet: EnhetSchema.nullable(),
  merknad: z.string().max(200).nullable(),
})

export const OppskriftSchema = z.object({
  id: z.string().uuid().optional(),
  tittel: z.string().min(1, 'Tittel må fylles ut'),
  beskrivelse: z.string().optional(),
  porsjoner: z.number().int().positive('Minst 1 porsjon'),
  forberedelsestidMinutter: z.number().int().nonnegative().optional(),
  tilberedningstidMinutter: z.number().int().nonnegative().optional(),
  ingredienser: z.array(IngrediensRequestSchema).min(1, 'Legg til minst én ingrediens'),
  steg: z.array(z.string().min(1)).min(1, 'Legg til minst ett steg'),
  kategoriIder: z.array(z.string().uuid()),
})

// Response types — what the API returns (different from the form/request schema above)
export const OppskriftListItemSchema = z.object({
  id: z.string().uuid(),
  tittel: z.string(),
  beskrivelse: z.string().nullable().optional(),
  porsjoner: z.number(),
  forberedelsestidMinutter: z.number().nullable().optional(),
  tilberedningstidMinutter: z.number().nullable().optional(),
  kategorier: z.array(KategoriSchema),
})

export const IngrediensResponseSchema = z.object({
  id: z.string().uuid(),
  butikkvareId: z.string().uuid(),
  navn: z.string(),
  avdeling: AvdelingSchema,
  mengde: z.number().nullable(),
  enhet: EnhetSchema.nullable(),
  merknad: z.string().nullable(),
})

export const OppskriftDetailSchema = OppskriftListItemSchema.extend({
  steg: z.array(z.string()),
  ingredienser: z.array(IngrediensResponseSchema),
})

export type IngrediensRequest = z.infer<typeof IngrediensRequestSchema>
export type IngrediensResponse = z.infer<typeof IngrediensResponseSchema>
export type Oppskrift = z.infer<typeof OppskriftSchema>
export type OppskriftListItem = z.infer<typeof OppskriftListItemSchema>
export type OppskriftDetail = z.infer<typeof OppskriftDetailSchema>
