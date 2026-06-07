import { useParams, useNavigate, Link } from 'react-router-dom'
import { ChevronLeft, Clock, Users, Pencil, Trash2 } from 'lucide-react'
import { useGetRecipeQuery, useDeleteRecipeMutation } from '@/features/recipes/recipesApi'

export default function RecipeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: recipe, isLoading } = useGetRecipeQuery(id!)
  const [deleteRecipe, { isLoading: isDeleting }] = useDeleteRecipeMutation()

  const handleDelete = async () => {
    if (!confirm('Delete this recipe? This cannot be undone.')) return
    await deleteRecipe(id!)
    navigate('/recipes')
  }

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>
  if (!recipe) return <p className="text-sm text-muted-foreground">Recipe not found.</p>

  const totalTime = (recipe.prepTimeMinutes ?? 0) + (recipe.cookTimeMinutes ?? 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/recipes')}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft size={16} />
          Recipes
        </button>
        <div className="flex items-center gap-2">
          <Link
            to={`/recipes/${id}/edit`}
            className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm hover:bg-accent transition-colors"
          >
            <Pencil size={14} />
            Edit
          </Link>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex items-center gap-1.5 rounded-md border border-destructive text-destructive px-3 py-1.5 text-sm hover:bg-destructive hover:text-destructive-foreground transition-colors disabled:opacity-50"
          >
            <Trash2 size={14} />
            Delete
          </button>
        </div>
      </div>

      <div>
        <h1 className="text-2xl font-semibold mb-1">{recipe.title}</h1>
        {recipe.description && (
          <p className="text-muted-foreground">{recipe.description}</p>
        )}
      </div>

      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Users size={14} />
          {recipe.servings} servings
        </span>
        {totalTime > 0 && (
          <span className="flex items-center gap-1.5">
            <Clock size={14} />
            {totalTime} min
          </span>
        )}
        {recipe.prepTimeMinutes && recipe.cookTimeMinutes && (
          <span className="text-xs">
            ({recipe.prepTimeMinutes} prep · {recipe.cookTimeMinutes} cook)
          </span>
        )}
      </div>

      {recipe.categories.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {recipe.categories.map((c) => (
            <span
              key={c.id}
              className="rounded-full bg-secondary px-2.5 py-0.5 text-xs text-secondary-foreground"
            >
              {c.name}
            </span>
          ))}
        </div>
      )}

      <div>
        <h2 className="font-semibold mb-3">Ingredients</h2>
        <ul className="space-y-1.5">
          {recipe.ingredients.map((i) => (
            <li key={i.id} className="flex items-baseline gap-2 text-sm">
              <span className="font-medium tabular-nums">
                {i.amount} {i.unit}
              </span>
              <span>{i.name}</span>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h2 className="font-semibold mb-3">Steps</h2>
        <ol className="space-y-3">
          {recipe.steps.map((step, index) => (
            <li key={index} className="flex gap-3 text-sm">
              <span className="font-semibold text-muted-foreground shrink-0 tabular-nums">
                {index + 1}.
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}
