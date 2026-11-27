import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { skipToken } from '@reduxjs/toolkit/query/react'
import { Plus, Trash2, ChevronUp, ChevronDown, ChevronLeft } from 'lucide-react'
import { useGetOppskriftQuery, useCreateOppskriftMutation, useUpdateOppskriftMutation } from '@/features/oppskrifter/oppskrifterApi'
import { useGetKategorierQuery, useCreateKategoriMutation } from '@/features/kategorier/kategorierApi'

// Internal schema — steg stored as { value } objects so useFieldArray can track them.
// Transformed to plain strings before sending to the API.
const optionalInt = z.union([z.number().int().nonnegative(), z.nan()])
  .transform((v) => (typeof v === 'number' && !isNaN(v) ? v : undefined))
  .optional()

const FormSchema = z.object({
  tittel: z.string().min(1, 'Tittel må fylles ut'),
  beskrivelse: z.string().optional(),
  porsjoner: z.number({ invalid_type_error: 'Må fylles ut' }).int().positive('Minst 1'),
  forberedelsestidMinutter: optionalInt,
  tilberedningstidMinutter: optionalInt,
  ingredienser: z.array(z.object({
    navn: z.string().min(1, 'Må fylles ut'),
    mengde: z.number({ invalid_type_error: 'Må fylles ut' }).positive('Må være > 0'),
    enhet: z.string().min(1, 'Må fylles ut'),
  })).min(1, 'Legg til minst én ingrediens'),
  steg: z.array(z.object({
    value: z.string().min(1, 'Steget kan ikke være tomt'),
  })).min(1, 'Legg til minst ett steg'),
  kategoriIder: z.array(z.string()),
})

type FormValues = z.infer<typeof FormSchema>

const inputClass = 'w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring'
const errorClass = 'text-xs text-destructive mt-0.5'

export default function OppskriftForm() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const { data: existing } = useGetOppskriftQuery(id ?? skipToken)
  const { data: alleKategorier = [] } = useGetKategorierQuery()
  const [createOppskrift] = useCreateOppskriftMutation()
  const [updateOppskrift] = useUpdateOppskriftMutation()
  const [createKategori] = useCreateKategoriMutation()

  const [nyKategoriNavn, setNyKategoriNavn] = useState('')
  const [kategoriError, setKategoriError] = useState('')

  const { register, control, handleSubmit, reset, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      tittel: '',
      beskrivelse: '',
      porsjoner: 2,
      ingredienser: [{ navn: '', mengde: 0, enhet: '' }],
      steg: [{ value: '' }],
      kategoriIder: [],
    },
  })

  const { fields: ingrediensFields, append: appendIngrediens, remove: removeIngrediens } = useFieldArray({ control, name: 'ingredienser' })
  const { fields: stegFields, append: appendSteg, remove: removeSteg, move: moveSteg } = useFieldArray({ control, name: 'steg' })

  const valgteKategoriIder = watch('kategoriIder')

  // Populate form when editing an existing oppskrift
  useEffect(() => {
    if (existing) {
      reset({
        tittel: existing.tittel,
        beskrivelse: existing.beskrivelse ?? '',
        porsjoner: existing.porsjoner,
        forberedelsestidMinutter: existing.forberedelsestidMinutter ?? undefined,
        tilberedningstidMinutter: existing.tilberedningstidMinutter ?? undefined,
        ingredienser: existing.ingredienser.map((i) => ({ navn: i.navn, mengde: i.mengde, enhet: i.enhet })),
        steg: existing.steg.map((value) => ({ value })),
        kategoriIder: existing.kategorier.map((k) => k.id),
      })
    }
  }, [existing, reset])

  const toggleKategori = (kategoriId: string) => {
    if (valgteKategoriIder.includes(kategoriId)) {
      setValue('kategoriIder', valgteKategoriIder.filter((id) => id !== kategoriId))
    } else {
      setValue('kategoriIder', [...valgteKategoriIder, kategoriId])
    }
  }

  const handleAddKategori = async () => {
    const navn = nyKategoriNavn.trim()
    if (!navn) return
    try {
      const opprettet = await createKategori({ navn }).unwrap()
      setValue('kategoriIder', [...valgteKategoriIder, opprettet.id])
      setNyKategoriNavn('')
      setKategoriError('')
    } catch {
      setKategoriError('Klarte ikke å opprette kategorien')
    }
  }

  const onSubmit = async (data: FormValues) => {
    const payload = {
      tittel: data.tittel,
      beskrivelse: data.beskrivelse || undefined,
      porsjoner: data.porsjoner,
      forberedelsestidMinutter: data.forberedelsestidMinutter,
      tilberedningstidMinutter: data.tilberedningstidMinutter,
      ingredienser: data.ingredienser,
      steg: data.steg.map((s) => s.value),
      kategoriIder: data.kategoriIder,
    }

    if (isEdit && id) {
      await updateOppskrift({ id, body: payload }).unwrap()
      navigate(`/oppskrifter/${id}`)
    } else {
      const opprettet = await createOppskrift(payload).unwrap()
      navigate(`/oppskrifter/${opprettet.id}`)
    }
  }

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(isEdit ? `/oppskrifter/${id}` : '/oppskrifter')}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft size={20} />
        </button>
        <h1 className="text-xl font-semibold">{isEdit ? 'Rediger oppskrift' : 'Ny oppskrift'}</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic fields */}
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Tittel *</label>
            <input className={inputClass} {...register('tittel')} />
            {errors.tittel && <p className={errorClass}>{errors.tittel.message}</p>}
          </div>

          <div>
            <label className="text-sm font-medium">Beskrivelse</label>
            <textarea
              className={`${inputClass} resize-none`}
              rows={2}
              {...register('beskrivelse')}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-sm font-medium">Porsjoner *</label>
              <input
                type="number"
                min={1}
                className={inputClass}
                {...register('porsjoner', { valueAsNumber: true })}
              />
              {errors.porsjoner && <p className={errorClass}>{errors.porsjoner.message}</p>}
            </div>
            <div>
              <label className="text-sm font-medium">Forberedelse (min)</label>
              <input
                type="number"
                min={0}
                className={inputClass}
                {...register('forberedelsestidMinutter', { valueAsNumber: true })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Tilberedning (min)</label>
              <input
                type="number"
                min={0}
                className={inputClass}
                {...register('tilberedningstidMinutter', { valueAsNumber: true })}
              />
            </div>
          </div>
        </div>

        {/* Ingredienser */}
        <div>
          <h2 className="font-medium mb-2">Ingredienser *</h2>
          {errors.ingredienser?.root && (
            <p className={errorClass}>{errors.ingredienser.root.message}</p>
          )}
          {errors.ingredienser?.message && (
            <p className={errorClass}>{errors.ingredienser.message}</p>
          )}
          <div className="space-y-2">
            {ingrediensFields.map((field, index) => (
              <div key={field.id} className="flex gap-2 items-start">
                <div className="flex-1">
                  <input
                    placeholder="Navn"
                    className={inputClass}
                    {...register(`ingredienser.${index}.navn`)}
                  />
                  {errors.ingredienser?.[index]?.navn && (
                    <p className={errorClass}>{errors.ingredienser[index].navn.message}</p>
                  )}
                </div>
                <div className="w-20">
                  <input
                    type="number"
                    placeholder="Mengde"
                    min={0}
                    step="any"
                    className={inputClass}
                    {...register(`ingredienser.${index}.mengde`, { valueAsNumber: true })}
                  />
                  {errors.ingredienser?.[index]?.mengde && (
                    <p className={errorClass}>{errors.ingredienser[index].mengde.message}</p>
                  )}
                </div>
                <div className="w-20">
                  <input
                    placeholder="Enhet"
                    className={inputClass}
                    {...register(`ingredienser.${index}.enhet`)}
                  />
                  {errors.ingredienser?.[index]?.enhet && (
                    <p className={errorClass}>{errors.ingredienser[index].enhet.message}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removeIngrediens(index)}
                  disabled={ingrediensFields.length === 1}
                  className="mt-2 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-30"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => appendIngrediens({ navn: '', mengde: 0, enhet: '' })}
            className="mt-2 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Plus size={14} /> Legg til ingrediens
          </button>
        </div>

        {/* Steg */}
        <div>
          <h2 className="font-medium mb-2">Fremgangsmåte *</h2>
          {errors.steg?.message && (
            <p className={errorClass}>{errors.steg.message}</p>
          )}
          <div className="space-y-2">
            {stegFields.map((field, index) => (
              <div key={field.id} className="flex gap-2 items-start">
                <span className="mt-2.5 text-sm text-muted-foreground font-medium tabular-nums w-5 shrink-0 text-right">
                  {index + 1}.
                </span>
                <div className="flex-1">
                  <textarea
                    className={`${inputClass} resize-none`}
                    rows={2}
                    placeholder={`Steg ${index + 1}`}
                    {...register(`steg.${index}.value`)}
                  />
                  {errors.steg?.[index]?.value && (
                    <p className={errorClass}>{errors.steg[index].value.message}</p>
                  )}
                </div>
                <div className="flex flex-col gap-1 mt-1.5">
                  <button
                    type="button"
                    onClick={() => moveSteg(index, index - 1)}
                    disabled={index === 0}
                    className="text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30"
                  >
                    <ChevronUp size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveSteg(index, index + 1)}
                    disabled={index === stegFields.length - 1}
                    className="text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30"
                  >
                    <ChevronDown size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeSteg(index)}
                    disabled={stegFields.length === 1}
                    className="text-muted-foreground hover:text-destructive transition-colors disabled:opacity-30"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => appendSteg({ value: '' })}
            className="mt-2 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Plus size={14} /> Legg til steg
          </button>
        </div>

        {/* Kategorier */}
        <div>
          <h2 className="font-medium mb-2">Kategorier</h2>
          {alleKategorier.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {alleKategorier.map((k) => {
                const valgt = valgteKategoriIder.includes(k.id)
                return (
                  <button
                    key={k.id}
                    type="button"
                    onClick={() => toggleKategori(k.id)}
                    className={`rounded-full px-3 py-1 text-sm border transition-colors ${
                      valgt
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background text-foreground border-border hover:bg-accent'
                    }`}
                  >
                    {k.navn}
                  </button>
                )
              })}
            </div>
          )}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Ny kategori…"
              value={nyKategoriNavn}
              onChange={(e) => setNyKategoriNavn(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddKategori() } }}
              className={`${inputClass} flex-1`}
            />
            <button
              type="button"
              onClick={handleAddKategori}
              className="rounded-md border px-3 py-2 text-sm hover:bg-accent transition-colors"
            >
              Legg til
            </button>
          </div>
          {kategoriError && <p className={errorClass}>{kategoriError}</p>}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-md bg-primary text-primary-foreground px-4 py-2.5 text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? 'Lagrer…' : isEdit ? 'Lagre endringer' : 'Opprett oppskrift'}
        </button>
      </form>
    </div>
  )
}
