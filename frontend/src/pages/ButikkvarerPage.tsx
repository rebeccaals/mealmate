import { useMemo, useState } from 'react'
import { ChevronDown, ChevronUp, Search } from 'lucide-react'
import {
  AVDELINGER,
  AVDELINGSNAVN,
  delIngredienslinjer,
  normaliserNavn,
  type Avdeling,
  type Butikkvare,
} from '@mealmate/schemas'
import {
  useGetButikkvarerQuery,
  useCreateButikkvarerMutation,
  useUpdateButikkvareMutation,
  useDeleteButikkvareMutation,
  useSlåSammenButikkvarerMutation,
} from '@/features/butikkvarer/butikkvarerApi'

const inputClass = 'rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring'

// The API sends a plain-text reason with 409 Conflict (e.g. "name already exists")
function feilmelding(error: unknown, fallback: string): string {
  const data = (error as { data?: unknown })?.data
  return typeof data === 'string' ? data : fallback
}

function AvdelingVelger({ value, onChange, disabled }: { value: Avdeling; onChange: (a: Avdeling) => void; disabled?: boolean }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as Avdeling)}
      disabled={disabled}
      aria-label="Avdeling"
      className="rounded-md border bg-background px-2 py-1 text-sm disabled:opacity-50"
    >
      {AVDELINGER.map((a) => (
        <option key={a} value={a}>{AVDELINGSNAVN[a]}</option>
      ))}
    </select>
  )
}

// One butikkvare. Avdeling can be changed straight away (the most common job after the migration
// put everything in "Annet"); rename, merge and delete are behind the expand arrow.
function ButikkvareRad({ butikkvare, alle }: { butikkvare: Butikkvare; alle: Butikkvare[] }) {
  const [åpen, setÅpen] = useState(false)
  const [navn, setNavn] = useState(butikkvare.navn)
  const [målId, setMålId] = useState('')
  const [feil, setFeil] = useState('')
  const [update, { isLoading: lagrer }] = useUpdateButikkvareMutation()
  const [slett, { isLoading: sletter }] = useDeleteButikkvareMutation()
  const [slåSammen, { isLoading: slårSammen }] = useSlåSammenButikkvarerMutation()

  const lagre = async (endring: { navn?: string; avdeling?: Avdeling }) => {
    setFeil('')
    try {
      await update({ id: butikkvare.id, body: { navn: butikkvare.navn, avdeling: butikkvare.avdeling, ...endring } }).unwrap()
    } catch (e) {
      setFeil(feilmelding(e, 'Klarte ikke å lagre'))
    }
  }

  const handleSlåSammen = async () => {
    const mål = alle.find((b) => b.id === målId)
    if (!mål || !confirm(`Slå sammen «${butikkvare.navn}» med «${mål.navn}»? Oppskriftene som bruker «${butikkvare.navn}» får «${mål.navn}» i stedet.`)) return
    await slåSammen({ id: butikkvare.id, målId }).unwrap()
  }

  const handleSlett = async () => {
    if (!confirm(`Slette «${butikkvare.navn}»?`)) return
    try {
      await slett(butikkvare.id).unwrap()
    } catch (e) {
      setFeil(feilmelding(e, 'Klarte ikke å slette'))
    }
  }

  return (
    <li className="rounded-md border bg-card px-3 py-2">
      <div className="flex items-center gap-2">
        <span className="flex-1 text-sm">
          {butikkvare.navn}
          {butikkvare.antallOppskrifter > 0 && (
            <span className="ml-1.5 text-xs text-muted-foreground">
              {butikkvare.antallOppskrifter} {butikkvare.antallOppskrifter === 1 ? 'oppskrift' : 'oppskrifter'}
            </span>
          )}
        </span>
        <AvdelingVelger value={butikkvare.avdeling} onChange={(avdeling) => lagre({ avdeling })} disabled={lagrer} />
        <button
          onClick={() => setÅpen((v) => !v)}
          aria-label={åpen ? 'Lukk' : 'Flere valg'}
          className="text-muted-foreground hover:text-foreground"
        >
          {åpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {åpen && (
        <div className="mt-3 space-y-3 border-t pt-3">
          <div className="flex gap-2">
            <input value={navn} onChange={(e) => setNavn(e.target.value)} className={`${inputClass} flex-1`} aria-label="Navn" />
            <button
              onClick={() => lagre({ navn })}
              disabled={lagrer || !navn.trim() || navn === butikkvare.navn}
              className="rounded-md border px-3 py-2 text-sm hover:bg-accent disabled:opacity-50"
            >
              Gi nytt navn
            </button>
          </div>

          <div className="flex gap-2">
            <select value={målId} onChange={(e) => setMålId(e.target.value)} className={`${inputClass} flex-1`} aria-label="Slå sammen med">
              <option value="">Slå sammen med…</option>
              {alle.filter((b) => b.id !== butikkvare.id).map((b) => (
                <option key={b.id} value={b.id}>{b.navn}</option>
              ))}
            </select>
            <button
              onClick={handleSlåSammen}
              disabled={!målId || slårSammen}
              className="rounded-md border px-3 py-2 text-sm hover:bg-accent disabled:opacity-50"
            >
              Slå sammen
            </button>
          </div>

          {butikkvare.antallOppskrifter === 0 ? (
            <button
              onClick={handleSlett}
              disabled={sletter}
              className="w-full rounded-md border border-destructive text-destructive px-3 py-2 text-sm hover:bg-destructive hover:text-destructive-foreground transition-colors disabled:opacity-50"
            >
              Slett
            </button>
          ) : (
            <p className="text-xs text-muted-foreground">Brukes i oppskrifter, så den kan ikke slettes – slå den sammen med en annen i stedet.</p>
          )}
        </div>
      )}

      {feil && <p className="mt-1 text-xs text-destructive">{feil}</p>}
    </li>
  )
}

export default function ButikkvarerPage() {
  const { data: butikkvarer = [], isLoading } = useGetButikkvarerQuery()
  const [create, { isLoading: oppretter }] = useCreateButikkvarerMutation()
  const [søk, setSøk] = useState('')
  const [nye, setNye] = useState('')
  const [nyAvdeling, setNyAvdeling] = useState<Avdeling>('Annet')
  const [melding, setMelding] = useState('')

  const gruppert = useMemo(() => {
    const s = normaliserNavn(søk)
    const treff = butikkvarer.filter((b) => !s || normaliserNavn(b.navn).includes(s))
    return AVDELINGER
      .map((avdeling) => ({ avdeling, varer: treff.filter((b) => b.avdeling === avdeling) }))
      .filter((g) => g.varer.length > 0)
  }, [butikkvarer, søk])

  const handleLeggTil = async () => {
    const navn = delIngredienslinjer(nye)
    if (navn.length === 0) return
    const opprettet = await create({ navn, avdeling: nyAvdeling }).unwrap()
    const fantes = navn.length - opprettet.length
    setMelding(`La til ${opprettet.length}${fantes > 0 ? ` (${fantes} fantes fra før)` : ''}.`)
    setNye('')
  }

  return (
    <div className="space-y-6 pb-8">
      <h1 className="text-xl font-semibold">Butikkvarer</h1>

      {/* Legg til flere */}
      <div className="space-y-2">
        <textarea
          value={nye}
          onChange={(e) => { setNye(e.target.value); setMelding('') }}
          rows={3}
          placeholder={'Legg til varer, én per linje\nDopapir\nOppvasktabletter'}
          className={`${inputClass} w-full resize-y`}
        />
        <div className="flex items-center gap-2">
          <AvdelingVelger value={nyAvdeling} onChange={setNyAvdeling} />
          <button
            onClick={handleLeggTil}
            disabled={oppretter || !nye.trim()}
            className="rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
          >
            Legg til
          </button>
          {melding && <span className="text-xs text-muted-foreground">{melding}</span>}
        </div>
      </div>

      {/* Søk */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={søk}
          onChange={(e) => setSøk(e.target.value)}
          placeholder="Søk…"
          className={`${inputClass} w-full pl-8`}
        />
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Laster…</p>}
      {!isLoading && butikkvarer.length === 0 && (
        <p className="text-sm text-muted-foreground text-center mt-8">
          Ingen butikkvarer ennå. De opprettes av seg selv når dere skriver oppskrifter.
        </p>
      )}

      {gruppert.map(({ avdeling, varer }) => (
        <section key={avdeling}>
          <h2 className="mb-2 text-sm font-medium text-muted-foreground">
            {AVDELINGSNAVN[avdeling]} <span className="font-normal">({varer.length})</span>
          </h2>
          <ul className="space-y-1.5">
            {varer.map((b) => (
              // key includes name and avdeling so the row's local state resets after a rename or merge
              <ButikkvareRad key={`${b.id}-${b.navn}`} butikkvare={b} alle={butikkvarer} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
