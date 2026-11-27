import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, X, Plus } from 'lucide-react'
import type { DayOfWeek, Måltidstype, MåltidResponse } from '@mealmate/schemas'
import { useGetUkesmenyQuery, useAddMåltidMutation, useRemoveMåltidMutation } from '@/features/ukesmeny/ukesmenyApi'
import { useGetOppskrifterQuery } from '@/features/oppskrifter/oppskrifterApi'

const DAGER: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const MÅLTIDSTYPER: Måltidstype[] = ['Frokost', 'Lunsj', 'Middag']

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

type ValgtMåltid = { dag: DayOfWeek; måltidstype: Måltidstype }

export default function UkesmenyPage() {
  const navigate = useNavigate()
  const [ukeMandag, setUkeMandag] = useState(() => getMandagIUken(new Date()))
  const [valgt, setValgt] = useState<ValgtMåltid | null>(null)

  const ukestart = formatUkestart(ukeMandag)
  const { data: ukesmeny, isLoading } = useGetUkesmenyQuery(ukestart)
  const { data: oppskrifter = [] } = useGetOppskrifterQuery()
  const [addMåltid] = useAddMåltidMutation()
  const [removeMåltid] = useRemoveMåltidMutation()

  const måltidMap = useMemo(() => {
    const map = new Map<string, MåltidResponse>()
    ukesmeny?.måltider.forEach((m) => map.set(`${m.dag}-${m.måltidstype}`, m))
    return map
  }, [ukesmeny?.måltider])

  const valgtMåltid = valgt
    ? måltidMap.get(`${valgt.dag}-${valgt.måltidstype}`)
    : undefined

  const handleVelgOppskrift = async (oppskriftId: string) => {
    if (!valgt) return
    await addMåltid({ ukestart, body: { dag: valgt.dag, måltidstype: valgt.måltidstype, oppskriftId } })
    setValgt(null)
  }

  const handleFjern = async () => {
    if (!valgt || !valgtMåltid?.id) return
    await removeMåltid({ ukestart, måltidId: valgtMåltid.id })
    setValgt(null)
  }

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
                            <span className="line-clamp-2 leading-tight">{måltid.oppskriftTittel}</span>
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

      {/* Panel for valgt måltid */}
      {valgt && (
        <div className="fixed inset-x-0 bottom-16 mx-4 rounded-xl border bg-card shadow-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              {DAGNAVN[valgt.dag]} · {valgt.måltidstype}
            </span>
            <button
              onClick={() => setValgt(null)}
              aria-label="Lukk"
              className="text-muted-foreground hover:text-foreground"
            >
              <X size={16} />
            </button>
          </div>

          {valgtMåltid ? (
            <div className="space-y-2">
              <p className="text-sm font-medium">{valgtMåltid.oppskriftTittel}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => { navigate(`/oppskrifter/${valgtMåltid.oppskriftId}`); setValgt(null) }}
                  className="flex-1 rounded-md border px-3 py-2 text-sm hover:bg-accent transition-colors"
                >
                  Se oppskrift
                </button>
                <button
                  onClick={handleFjern}
                  className="flex-1 rounded-md border border-destructive text-destructive px-3 py-2 text-sm hover:bg-destructive hover:text-destructive-foreground transition-colors"
                >
                  Fjern
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Velg en oppskrift</p>
              <div className="max-h-48 overflow-y-auto space-y-1">
                {oppskrifter.length === 0 && (
                  <p className="text-sm text-muted-foreground">Ingen oppskrifter ennå.</p>
                )}
                {oppskrifter.map((o) => (
                  <button
                    key={o.id}
                    onClick={() => handleVelgOppskrift(o.id)}
                    className="w-full text-left rounded-md px-3 py-2 text-sm hover:bg-accent transition-colors"
                  >
                    {o.tittel}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
