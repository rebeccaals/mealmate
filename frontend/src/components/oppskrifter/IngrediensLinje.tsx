import type { ClipboardEvent, KeyboardEvent } from 'react'
import type { UseFormRegisterReturn } from 'react-hook-form'
import { Check, Trash2 } from 'lucide-react'
import {
  AVDELINGER,
  AVDELINGSNAVN,
  finnButikkvare,
  foreslåButikkvarer,
  formatIngrediens,
  formatMengde,
  tolkIngredienslinje,
  type Avdeling,
  type Butikkvare,
} from '@mealmate/schemas'

interface Props {
  tekst: string
  avdeling: Avdeling | null
  butikkvarer: Butikkvare[]
  register: UseFormRegisterReturn
  error?: string
  kanFjernes: boolean
  onTekst: (tekst: string) => void
  onAvdeling: (avdeling: Avdeling | null) => void
  onFjern: () => void
  /** Enter: start a new line below */
  onNyLinje: () => void
  /** Pasted text with several lines: first line stays here, the rest become new lines */
  onLimInnFlere: (linjer: string[]) => void
}

const chip = 'rounded bg-secondary px-1.5 py-0.5 text-secondary-foreground'

// One ingredient written as free text ("2 ss smør, myk"), with what the app understood shown below it
export default function IngrediensLinje({
  tekst, avdeling, butikkvarer, register, error, kanFjernes, onTekst, onAvdeling, onFjern, onNyLinje, onLimInnFlere,
}: Props) {
  const tolket = tolkIngredienslinje(tekst)
  const treff = tolket.navn ? finnButikkvare(tolket.navn, butikkvarer) : undefined
  const forslag = tolket.navn && !treff ? foreslåButikkvarer(tolket.navn, butikkvarer) : []

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      onNyLinje()
    }
  }

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    const linjer = e.clipboardData.getData('text').split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
    if (linjer.length > 1) {
      e.preventDefault()
      onLimInnFlere(linjer)
    }
  }

  // Swap the typed name for a suggested butikkvare, keeping amount, enhet and merknad
  const brukForslag = (navn: string) => onTekst(formatIngrediens({ ...tolket, navn }))

  return (
    <div>
      <div className="flex gap-2 items-center">
        <input
          {...register}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder="F.eks. 2 ss smør – eller lim inn hele listen"
          autoComplete="off"
          className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          type="button"
          onClick={onFjern}
          disabled={!kanFjernes}
          aria-label="Fjern ingrediens"
          className="text-muted-foreground hover:text-destructive transition-colors disabled:opacity-30"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {tekst.trim() && (
        <div className="mt-1 flex flex-wrap items-center gap-1 text-xs">
          {tolket.mengde !== null && <span className={chip}>{formatMengde(tolket.mengde)}</span>}
          {tolket.enhet !== null && <span className={chip}>{tolket.enhet}</span>}

          {treff && (
            <span className={`${chip} flex items-center gap-1 font-medium`}>
              {treff.navn} <Check size={11} />
            </span>
          )}

          {!treff && tolket.navn && (
            <>
              <span className="rounded border border-dashed px-1.5 py-0.5">
                Ny vare: «{tolket.navn}»
              </span>
              <select
                value={avdeling ?? ''}
                onChange={(e) => onAvdeling(e.target.value ? (e.target.value as Avdeling) : null)}
                aria-label="Avdeling for ny vare"
                className="rounded border bg-background px-1 py-0.5"
              >
                <option value="">Avdeling…</option>
                {AVDELINGER.map((a) => (
                  <option key={a} value={a}>{AVDELINGSNAVN[a]}</option>
                ))}
              </select>
            </>
          )}

          {tolket.merknad && <span className="text-muted-foreground italic">{tolket.merknad}</span>}

          {forslag.length > 0 && (
            <span className="flex flex-wrap items-center gap-1 text-muted-foreground">
              Mente du:
              {forslag.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => brukForslag(b.navn)}
                  className="rounded border px-1.5 py-0.5 text-foreground hover:bg-accent"
                >
                  {b.navn}
                </button>
              ))}
            </span>
          )}
        </div>
      )}

      {error && <p className="text-xs text-destructive mt-0.5">{error}</p>}
    </div>
  )
}
