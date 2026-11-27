import { z } from 'zod'
import { KategoriSchema } from './kategori'

export const IngrediensSchema = z.object({
  id: z.string().uuid().optional(),
  navn: z.string().min(1, 'Navn må fylles ut'),
  mengde: z.number().positive('Mengde må være større enn 0'),
  enhet: z.string().min(1, 'Enhet må fylles ut'),
})

export const OppskriftSchema = z.object({
  id: z.string().uuid().optional(),
  tittel: z.string().min(1, 'Tittel må fylles ut'),
  beskrivelse: z.string().optional(),
  porsjoner: z.number().int().positive('Minst 1 porsjon'),
  forberedelsestidMinutter: z.number().int().nonnegative().optional(),
  tilberedningstidMinutter: z.number().int().nonnegative().optional(),
  ingredienser: z.array(IngrediensSchema).min(1, 'Legg til minst én ingrediens'),
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

export const OppskriftDetailSchema = OppskriftListItemSchema.extend({
  steg: z.array(z.string()),
  ingredienser: z.array(z.object({
    id: z.string().uuid(),
    navn: z.string(),
    mengde: z.number(),
    enhet: z.string(),
  })),
})

export type Ingrediens = z.infer<typeof IngrediensSchema>
export type Oppskrift = z.infer<typeof OppskriftSchema>
export type OppskriftListItem = z.infer<typeof OppskriftListItemSchema>
export type OppskriftDetail = z.infer<typeof OppskriftDetailSchema>
