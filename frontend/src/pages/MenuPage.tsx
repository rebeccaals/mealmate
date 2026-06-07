import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, X, Plus } from 'lucide-react'
import type { DayOfWeek, MealType, MenuEntryResponse } from '@mealmate/schemas'
import { useGetMenuQuery, useAddMenuEntryMutation, useRemoveMenuEntryMutation } from '@/features/menu/menuApi'
import { useGetRecipesQuery } from '@/features/recipes/recipesApi'

const DAYS: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const MEAL_TYPES: MealType[] = ['Breakfast', 'Lunch', 'Dinner']

function getMondayOfWeek(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function formatWeekStart(date: Date): string {
  return date.toISOString().split('T')[0]
}

function formatWeekLabel(monday: Date): string {
  const sunday = new Date(monday)
  sunday.setDate(sunday.getDate() + 6)
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
  return `${monday.toLocaleDateString('en-GB', opts)} – ${sunday.toLocaleDateString('en-GB', opts)}`
}

type SelectedCell = { day: DayOfWeek; mealType: MealType }

export default function MenuPage() {
  const navigate = useNavigate()
  const [weekMonday, setWeekMonday] = useState(() => getMondayOfWeek(new Date()))
  const [selectedCell, setSelectedCell] = useState<SelectedCell | null>(null)

  const weekStart = formatWeekStart(weekMonday)
  const { data: menu, isLoading } = useGetMenuQuery(weekStart)
  const { data: recipes = [] } = useGetRecipesQuery()
  const [addEntry] = useAddMenuEntryMutation()
  const [removeEntry] = useRemoveMenuEntryMutation()

  const entryMap = useMemo(() => {
    const map = new Map<string, MenuEntryResponse>()
    menu?.entries.forEach((e) => map.set(`${e.day}-${e.mealType}`, e))
    return map
  }, [menu?.entries])

  const selectedEntry = selectedCell
    ? entryMap.get(`${selectedCell.day}-${selectedCell.mealType}`)
    : undefined

  const handleCellTap = (day: DayOfWeek, mealType: MealType) => {
    setSelectedCell({ day, mealType })
  }

  const handlePickRecipe = async (recipeId: string) => {
    if (!selectedCell) return
    await addEntry({ weekStart, body: { day: selectedCell.day, mealType: selectedCell.mealType, recipeId } })
    setSelectedCell(null)
  }

  const handleRemove = async () => {
    if (!selectedCell || !selectedEntry?.id) return
    await removeEntry({ weekStart, entryId: selectedEntry.id })
    setSelectedCell(null)
  }

  return (
    <div className="space-y-4">
      {/* Week navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setWeekMonday((d) => { const n = new Date(d); n.setDate(n.getDate() - 7); return n })}
          className="p-1.5 rounded-md hover:bg-accent transition-colors"
        >
          <ChevronLeft size={18} />
        </button>
        <span className="text-sm font-medium">{formatWeekLabel(weekMonday)}</span>
        <button
          onClick={() => setWeekMonday((d) => { const n = new Date(d); n.setDate(n.getDate() + 7); return n })}
          className="p-1.5 rounded-md hover:bg-accent transition-colors"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Grid */}
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr>
                <th className="w-16" />
                {DAYS.map((day) => (
                  <th key={day} className="text-center font-medium text-muted-foreground pb-2 px-1">
                    {day.slice(0, 3)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MEAL_TYPES.map((mealType) => (
                <tr key={mealType}>
                  <td className="text-muted-foreground font-medium pr-2 py-1 whitespace-nowrap">
                    {mealType}
                  </td>
                  {DAYS.map((day) => {
                    const entry = entryMap.get(`${day}-${mealType}`)
                    const isSelected = selectedCell?.day === day && selectedCell?.mealType === mealType
                    return (
                      <td key={day} className="px-0.5 py-1">
                        <button
                          onClick={() => handleCellTap(day, mealType)}
                          className={`w-full min-h-12 rounded-md border text-left p-1.5 transition-colors ${
                            isSelected
                              ? 'border-primary bg-primary/10'
                              : entry
                              ? 'border-border bg-card hover:bg-accent'
                              : 'border-dashed border-border hover:border-primary hover:bg-accent'
                          }`}
                        >
                          {entry ? (
                            <span className="line-clamp-2 leading-tight">{entry.recipeTitle}</span>
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

      {/* Cell action panel */}
      {selectedCell && (
        <div className="fixed inset-x-0 bottom-16 mx-4 rounded-xl border bg-card shadow-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              {selectedCell.day} · {selectedCell.mealType}
            </span>
            <button onClick={() => setSelectedCell(null)} className="text-muted-foreground hover:text-foreground">
              <X size={16} />
            </button>
          </div>

          {selectedEntry ? (
            // Filled cell options
            <div className="space-y-2">
              <p className="text-sm font-medium">{selectedEntry.recipeTitle}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => { navigate(`/recipes/${selectedEntry.recipeId}`); setSelectedCell(null) }}
                  className="flex-1 rounded-md border px-3 py-2 text-sm hover:bg-accent transition-colors"
                >
                  View recipe
                </button>
                <button
                  onClick={handleRemove}
                  className="flex-1 rounded-md border border-destructive text-destructive px-3 py-2 text-sm hover:bg-destructive hover:text-destructive-foreground transition-colors"
                >
                  Remove
                </button>
              </div>
            </div>
          ) : (
            // Recipe picker
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Pick a recipe</p>
              <div className="max-h-48 overflow-y-auto space-y-1">
                {recipes.length === 0 && (
                  <p className="text-sm text-muted-foreground">No recipes yet.</p>
                )}
                {recipes.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => handlePickRecipe(r.id)}
                    className="w-full text-left rounded-md px-3 py-2 text-sm hover:bg-accent transition-colors"
                  >
                    {r.title}
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
