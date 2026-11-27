import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Minus, Plus, Search } from 'lucide-react'
import {
  STANDARD_PORSJONER,
  type DayOfWeek,
  type Måltidstype,
  type MåltidResponse,
  type OppskriftListItem,
  type SaveMåltidRequest,
} from '@mealmate/schemas'
import { useSaveMåltidMutation } from '@/features/ukesmeny/ukesmenyApi'

interface Props {
  ukestart: string
  dag: DayOfWeek
  dagnavn: string
  måltidstype: Måltidstype
  måltid: MåltidResponse | undefined
  alleOppskrifter: OppskriftListItem[]
  onClose: () => void
}

// Every change is saved straight away — no save button. The måltid is sent as a whole
// (porsjoner + notat + oppskrifter); an empty måltid is removed by the backend.
export default function MåltidPanel({ ukestart, dag, dagnavn, måltidstype, måltid, alleOppskrifter, onClose }: Props) {
  const navigate = useNavigate()
  const [saveMåltid, { isLoading: isSaving }] = useSaveMåltidMutation()
  const [søk, setSøk] = useState('')
  const [notat, setNotat] = useState(måltid?.notat ?? '')

  const valgte = måltid?.oppskrifter ?? []
  const porsjoner = måltid?.porsjoner ?? STANDARD_PORSJONER

  const lagre = (endring: Partial<SaveMåltidRequest>) =>
    saveMåltid({
      ukestart,
      dag,
      måltidstype,
      body: {
        porsjoner,
        notat: notat.trim() || null,
        oppskriftIder: valgte.map((o) => o.id),
        ...endring,
      },
    })

  const leggTil = (oppskriftId: string) => {
    lagre({ oppskriftIder: [...valgte.map((o) => o.id), oppskriftId] })
    setSøk('')
  }

  const fjern = (oppskriftId: string) =>
    lagre({ oppskriftIder: valgte.filter((o) => o.id !== oppskriftId).map((o) => o.id) })

  const lagreNotat = () => {
    if ((notat.trim() || null) !== (måltid?.notat ?? null)) lagre({})
  }

  const tøm = () => {
    setNotat('')
    lagre({ notat: null, oppskriftIder: [] })
  }

  const valgteIder = new Set(valgte.map((o) => o.id))
  const forslag = alleOppskrifter
    .filter((o) => !valgteIder.has(o.id))
    .filter((o) => o.tittel.toLowerCase().includes(søk.trim().toLowerCase()))

  const erTomt = valgte.length === 0 && !måltid?.notat

  return (
    <div className="fixed inset-x-0 bottom-16 mx-4 max-h-[70vh] overflow-y-auto rounded-xl border bg-card shadow-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">
          {dagnavn} · {måltidstype}
        </span>
        <button onClick={onClose} aria-label="Lukk" className="text-muted-foreground hover:text-foreground">
          <X size={16} />
        </button>
      </div>

      {/* Valgte oppskrifter */}
      {valgte.length > 0 && (
        <ul className="space-y-1">
          {valgte.map((o) => (
            <li key={o.id} className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
              <button
                onClick={() => navigate(`/oppskrifter/${o.id}`)}
                className="flex-1 text-left hover:underline"
              >
                {o.tittel}
              </button>
              <button
                onClick={() => fjern(o.id)}
                disabled={isSaving}
                aria-label={`Fjern ${o.tittel}`}
                className="text-muted-foreground hover:text-destructive disabled:opacity-50"
              >
                <X size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Porsjoner */}
      <div className="flex items-center justify-between">
        <span className="text-sm">Porsjoner</span>
        <div className="flex items-center gap-3">
          <button
            onClick={() => lagre({ porsjoner: porsjoner - 1 })}
            disabled={isSaving || porsjoner <= 1 || erTomt}
            aria-label="Færre porsjoner"
            className="rounded-md border p-1.5 hover:bg-accent disabled:opacity-30"
          >
            <Minus size={14} />
          </button>
          <span className="w-6 text-center text-sm font-medium tabular-nums">{porsjoner}</span>
          <button
            onClick={() => lagre({ porsjoner: porsjoner + 1 })}
            disabled={isSaving || porsjoner >= 50 || erTomt}
            aria-label="Flere porsjoner"
            className="rounded-md border p-1.5 hover:bg-accent disabled:opacity-30"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>

      {/* Notat */}
      <input
        value={notat}
        onChange={(e) => setNotat(e.target.value)}
        onBlur={lagreNotat}
        onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur() }}
        maxLength={200}
        placeholder="Notat, f.eks. «Rester» eller «Spiser ute»"
        className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      />

      {/* Legg til oppskrift */}
      <div className="space-y-2">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={søk}
            onChange={(e) => setSøk(e.target.value)}
            placeholder="Legg til oppskrift…"
            className="w-full rounded-md border bg-background pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="max-h-40 overflow-y-auto space-y-1">
          {alleOppskrifter.length === 0 && (
            <p className="text-sm text-muted-foreground">Ingen oppskrifter ennå.</p>
          )}
          {alleOppskrifter.length > 0 && forslag.length === 0 && (
            <p className="text-sm text-muted-foreground">Ingen treff.</p>
          )}
          {forslag.map((o) => (
            <button
              key={o.id}
              onClick={() => leggTil(o.id)}
              disabled={isSaving}
              className="w-full text-left rounded-md px-3 py-2 text-sm hover:bg-accent transition-colors disabled:opacity-50"
            >
              {o.tittel}
            </button>
          ))}
        </div>
      </div>

      {!erTomt && (
        <button
          onClick={tøm}
          disabled={isSaving}
          className="w-full rounded-md border border-destructive text-destructive px-3 py-2 text-sm hover:bg-destructive hover:text-destructive-foreground transition-colors disabled:opacity-50"
        >
          Tøm måltid
        </button>
      )}
    </div>
  )
}
