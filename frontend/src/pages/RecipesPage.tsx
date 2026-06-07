import { Link } from 'react-router-dom'
import { Clock, Users } from 'lucide-react'
import { useGetRecipesQuery } from '@/features/recipes/recipesApi'
import type { RecipeListItem } from '@mealmate/schemas'

function RecipeCard({ recipe }: { recipe: RecipeListItem }) {
  const totalTime = (recipe.prepTimeMinutes ?? 0) + (recipe.cookTimeMinutes ?? 0)

  return (
    <Link
      to={`/recipes/${recipe.id}`}
      className="block rounded-lg border bg-card p-4 hover:bg-accent transition-colors"
    >
      <h2 className="font-medium mb-1">{recipe.title}</h2>
      {recipe.description && (
        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{recipe.description}</p>
      )}
      <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
        <span className="flex items-center gap-1">
          <Users size={12} />
          {recipe.servings}
        </span>
        {totalTime > 0 && (
          <span className="flex items-center gap-1">
            <Clock size={12} />
            {totalTime} min
          </span>
        )}
      </div>
      {recipe.categories.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {recipe.categories.map((c) => (
            <span
              key={c.id}
              className="rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground"
            >
              {c.name}
            </span>
          ))}
        </div>
      )}
    </Link>
  )
}

export default function RecipesPage() {
  const { data: recipes, isLoading } = useGetRecipesQuery()

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Recipes</h1>
        <Link
          to="/recipes/new"
          className="rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          Add recipe
        </Link>
      </div>

      {isLoading && <p className="text-muted-foreground text-sm">Loading…</p>}

      {!isLoading && recipes?.length === 0 && (
        <p className="text-muted-foreground text-sm text-center mt-12">
          No recipes yet. Add your first one!
        </p>
      )}

      <div className="grid gap-3">
        {recipes?.map((r) => <RecipeCard key={r.id} recipe={r} />)}
      </div>
    </div>
  )
}
