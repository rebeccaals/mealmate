import { useParams, useNavigate, Link } from 'react-router-dom'
import { ChevronLeft, Clock, Users, Pencil, Trash2 } from 'lucide-react'
import { useGetOppskriftQuery, useDeleteOppskriftMutation } from '@/features/oppskrifter/oppskrifterApi'
import { formatMengde } from '@mealmate/schemas'

export default function OppskriftDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: oppskrift, isLoading } = useGetOppskriftQuery(id!)
  const [deleteOppskrift, { isLoading: isDeleting }] = useDeleteOppskriftMutation()

  const handleDelete = async () => {
    if (!confirm('Slette denne oppskriften? Det kan ikke angres.')) return
    await deleteOppskrift(id!)
    navigate('/oppskrifter')
  }

  if (isLoading) return <p className="text-sm text-muted-foreground">Laster…</p>
  if (!oppskrift) return <p className="text-sm text-muted-foreground">Fant ikke oppskriften.</p>

  const totalTid = (oppskrift.forberedelsestidMinutter ?? 0) + (oppskrift.tilberedningstidMinutter ?? 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/oppskrifter')}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft size={16} />
          Oppskrifter
        </button>
        <div className="flex items-center gap-2">
          <Link
            to={`/oppskrifter/${id}/rediger`}
            className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm hover:bg-accent transition-colors"
          >
            <Pencil size={14} />
            Rediger
          </Link>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex items-center gap-1.5 rounded-md border border-destructive text-destructive px-3 py-1.5 text-sm hover:bg-destructive hover:text-destructive-foreground transition-colors disabled:opacity-50"
          >
            <Trash2 size={14} />
            Slett
          </button>
        </div>
      </div>

      <div>
        <h1 className="text-2xl font-semibold mb-1">{oppskrift.tittel}</h1>
        {oppskrift.beskrivelse && (
          <p className="text-muted-foreground">{oppskrift.beskrivelse}</p>
        )}
      </div>

      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Users size={14} />
          {oppskrift.porsjoner} porsjoner
        </span>
        {totalTid > 0 && (
          <span className="flex items-center gap-1.5">
            <Clock size={14} />
            {totalTid} min
          </span>
        )}
        {oppskrift.forberedelsestidMinutter && oppskrift.tilberedningstidMinutter && (
          <span className="text-xs">
            ({oppskrift.forberedelsestidMinutter} forberedelse · {oppskrift.tilberedningstidMinutter} tilberedning)
          </span>
        )}
      </div>

      {oppskrift.kategorier.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {oppskrift.kategorier.map((k) => (
            <span
              key={k.id}
              className="rounded-full bg-secondary px-2.5 py-0.5 text-xs text-secondary-foreground"
            >
              {k.navn}
            </span>
          ))}
        </div>
      )}

      <div>
        <h2 className="font-semibold mb-3">Ingredienser</h2>
        <ul className="space-y-1.5">
          {oppskrift.ingredienser.map((i) => (
            <li key={i.id} className="flex items-baseline gap-2 text-sm">
              {i.mengde !== null && (
                <span className="font-medium tabular-nums">
                  {formatMengde(i.mengde)}{i.enhet && i.enhet !== 'stk' ? ` ${i.enhet}` : ''}
                </span>
              )}
              <span>
                {i.navn}
                {i.merknad && <span className="text-muted-foreground">, {i.merknad}</span>}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h2 className="font-semibold mb-3">Fremgangsmåte</h2>
        <ol className="space-y-3">
          {oppskrift.steg.map((steg, index) => (
            <li key={index} className="flex gap-3 text-sm">
              <span className="font-semibold text-muted-foreground shrink-0 tabular-nums">
                {index + 1}.
              </span>
              <span>{steg}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}
