import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Plus, Users } from 'lucide-react'
import { STANDARD_PORSJONER, type DayOfWeek, type Måltidstype, type MåltidResponse } from '@mealmate/schemas'
import { useGetUkesmenyQuery } from '@/features/ukesmeny/ukesmenyApi'
import { useGetOppskrifterQuery } from '@/features/oppskrifter/oppskrifterApi'
import MåltidPanel from '@/components/ukesmeny/MåltidPanel'

const DAGER: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const MÅLTIDSTYPER: Måltidstype[] = ['Frokost', 'Lunsj', 'Middag', 'Kvelds']

const DAGNAVN: Record<DayOfWeek, string> = {
  Monday: 'Mandag',
  Tuesday: 'Tirsdag',
  Wednesday: 'Onsdag',
  Thursday: 'Torsdag',
  Friday: 'Fredag',
  Saturday: 'Lørdag',
  Sunday: 'Søndag',
}

function getMandagIUken(dato: Date): Date {
  const d = new Date(dato)
  const dag = d.getDay()
  const diff = dag === 0 ? -6 : 1 - dag
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function formatUkestart(dato: Date): string {
  const year = dato.getFullYear()
  const month = String(dato.getMonth() + 1).padStart(2, '0')
  const day = String(dato.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatUkeLabel(mandag: Date): string {
  const søndag = new Date(mandag)
  søndag.setDate(søndag.getDate() + 6)
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
  return `${mandag.toLocaleDateString('nb-NO', opts)} – ${søndag.toLocaleDateString('nb-NO', opts)}`
}

// What a filled måltid shows in the grid: first oppskrift (+ how many more), or the notat
function MåltidInnhold({ måltid }: { måltid: MåltidResponse }) {
  const [første, ...resten] = måltid.oppskrifter
  return (
    <span className="block leading-tight">
      {første ? (
        <span className="line-clamp-2">{første.tittel}</span>
      ) : (
        <span className="line-clamp-2 italic text-muted-foreground">{måltid.notat}</span>
      )}
      {(resten.length > 0 || (første && måltid.porsjoner !== STANDARD_PORSJONER)) && (
        <span className="mt-0.5 flex items-center gap-1 text-[10px] text-muted-foreground">
          {resten.length > 0 && <span>+{resten.length}</span>}
          {første && måltid.porsjoner !== STANDARD_PORSJONER && (
            <span className="flex items-center gap-0.5">
              <Users size={9} />
              {måltid.porsjoner}
            </span>
          )}
        </span>
      )}
    </span>
  )
}

type ValgtMåltid = { dag: DayOfWeek; måltidstype: Måltidstype }

export default function UkesmenyPage() {
  const [ukeMandag, setUkeMandag] = useState(() => getMandagIUken(new Date()))
  const [valgt, setValgt] = useState<ValgtMåltid | null>(null)

  const ukestart = formatUkestart(ukeMandag)
  const { data: ukesmeny, isLoading } = useGetUkesmenyQuery(ukestart)
  const { data: oppskrifter = [] } = useGetOppskrifterQuery()

  const måltidMap = useMemo(() => {
    const map = new Map<string, MåltidResponse>()
    ukesmeny?.måltider.forEach((m) => map.set(`${m.dag}-${m.måltidstype}`, m))
    return map
  }, [ukesmeny?.måltider])

  const valgtMåltid = valgt
    ? måltidMap.get(`${valgt.dag}-${valgt.måltidstype}`)
    : undefined

  const flyttUke = (dager: number) =>
    setUkeMandag((d) => { const n = new Date(d); n.setDate(n.getDate() + dager); return n })

  return (
    <div className="space-y-4">
      {/* Ukenavigasjon */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => flyttUke(-7)}
          aria-label="Forrige uke"
          className="p-1.5 rounded-md hover:bg-accent transition-colors"
        >
          <ChevronLeft size={18} />
        </button>
        <span className="text-sm font-medium">{formatUkeLabel(ukeMandag)}</span>
        <button
          onClick={() => flyttUke(7)}
          aria-label="Neste uke"
          className="p-1.5 rounded-md hover:bg-accent transition-colors"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Rutenett */}
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Laster…</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr>
                <th className="w-16" />
                {DAGER.map((dag) => (
                  <th key={dag} className="text-center font-medium text-muted-foreground pb-2 px-1">
                    {DAGNAVN[dag].slice(0, 3)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MÅLTIDSTYPER.map((måltidstype) => (
                <tr key={måltidstype}>
                  <td className="text-muted-foreground font-medium pr-2 py-1 whitespace-nowrap">
                    {måltidstype}
                  </td>
                  {DAGER.map((dag) => {
                    const måltid = måltidMap.get(`${dag}-${måltidstype}`)
                    const erValgt = valgt?.dag === dag && valgt?.måltidstype === måltidstype
                    return (
                      <td key={dag} className="px-0.5 py-1">
                        <button
                          onClick={() => setValgt({ dag, måltidstype })}
                          className={`w-full min-h-12 rounded-md border text-left p-1.5 transition-colors ${
                            erValgt
                              ? 'border-primary bg-primary/10'
                              : måltid
                              ? 'border-border bg-card hover:bg-accent'
                              : 'border-dashed border-border hover:border-primary hover:bg-accent'
                          }`}
                        >
                          {måltid ? (
                            <MåltidInnhold måltid={måltid} />
                          ) : (
                            <Plus size={12} className="text-muted-foreground m-auto" />
                          )}
                        </button>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Panel for valgt måltid. key resets the panel's local state when another måltid is chosen */}
      {valgt && (
        <MåltidPanel
          key={`${ukestart}-${valgt.dag}-${valgt.måltidstype}`}
          ukestart={ukestart}
          dag={valgt.dag}
          dagnavn={DAGNAVN[valgt.dag]}
          måltidstype={valgt.måltidstype}
          måltid={valgtMåltid}
          alleOppskrifter={oppskrifter}
          onClose={() => setValgt(null)}
        />
      )}
    </div>
  )
}
