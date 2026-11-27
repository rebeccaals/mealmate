import { Link } from 'react-router-dom'
import { Clock, Users } from 'lucide-react'
import { useGetOppskrifterQuery } from '@/features/oppskrifter/oppskrifterApi'
import type { OppskriftListItem } from '@mealmate/schemas'

function OppskriftCard({ oppskrift }: { oppskrift: OppskriftListItem }) {
  const totalTid = (oppskrift.forberedelsestidMinutter ?? 0) + (oppskrift.tilberedningstidMinutter ?? 0)

  return (
    <Link
      to={`/oppskrifter/${oppskrift.id}`}
      className="block rounded-lg border bg-card p-4 hover:bg-accent transition-colors"
    >
      <h2 className="font-medium mb-1">{oppskrift.tittel}</h2>
      {oppskrift.beskrivelse && (
        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{oppskrift.beskrivelse}</p>
      )}
      <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
        <span className="flex items-center gap-1">
          <Users size={12} />
          {oppskrift.porsjoner}
        </span>
        {totalTid > 0 && (
          <span className="flex items-center gap-1">
            <Clock size={12} />
            {totalTid} min
          </span>
        )}
      </div>
      {oppskrift.kategorier.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {oppskrift.kategorier.map((k) => (
            <span
              key={k.id}
              className="rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground"
            >
              {k.navn}
            </span>
          ))}
        </div>
      )}
    </Link>
  )
}

export default function OppskrifterPage() {
  const { data: oppskrifter, isLoading } = useGetOppskrifterQuery()

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Oppskrifter</h1>
        <Link
          to="/oppskrifter/ny"
          className="rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          Ny oppskrift
        </Link>
      </div>

      {isLoading && <p className="text-muted-foreground text-sm">Laster…</p>}

      {!isLoading && oppskrifter?.length === 0 && (
        <p className="text-muted-foreground text-sm text-center mt-12">
          Ingen oppskrifter ennå. Legg inn den første!
        </p>
      )}

      <div className="grid gap-3">
        {oppskrifter?.map((o) => <OppskriftCard key={o.id} oppskrift={o} />)}
      </div>
    </div>
  )
}
