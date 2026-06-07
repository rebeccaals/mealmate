import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { skipToken } from '@reduxjs/toolkit/query/react'
import { Plus, Trash2, ChevronUp, ChevronDown, ChevronLeft } from 'lucide-react'
import { useGetRecipeQuery, useCreateRecipeMutation, useUpdateRecipeMutation } from '@/features/recipes/recipesApi'
import { useGetCategoriesQuery, useCreateCategoryMutation } from '@/features/categories/categoriesApi'

// Internal schema — steps stored as { value } objects so useFieldArray can track them.
// Transformed to plain strings before sending to the API.
const optionalInt = z.union([z.number().int().nonnegative(), z.nan()])
  .transform((v) => (typeof v === 'number' && !isNaN(v) ? v : undefined))
  .optional()

const FormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  servings: z.number({ invalid_type_error: 'Required' }).int().positive('Must be at least 1'),
  prepTimeMinutes: optionalInt,
  cookTimeMinutes: optionalInt,
  ingredients: z.array(z.object({
    name: z.string().min(1, 'Required'),
    amount: z.number({ invalid_type_error: 'Required' }).positive('Must be > 0'),
    unit: z.string().min(1, 'Required'),
  })).min(1, 'Add at least one ingredient'),
  steps: z.array(z.object({
    value: z.string().min(1, 'Step cannot be empty'),
  })).min(1, 'Add at least one step'),
  categoryIds: z.array(z.string()),
})

type FormValues = z.infer<typeof FormSchema>

const inputClass = 'w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring'
const errorClass = 'text-xs text-destructive mt-0.5'

export default function RecipeForm() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const { data: existing } = useGetRecipeQuery(id ?? skipToken)
  const { data: allCategories = [] } = useGetCategoriesQuery()
  const [createRecipe] = useCreateRecipeMutation()
  const [updateRecipe] = useUpdateRecipeMutation()
  const [createCategory] = useCreateCategoryMutation()

  const [newCategoryName, setNewCategoryName] = useState('')
  const [categoryError, setCategoryError] = useState('')

  const { register, control, handleSubmit, reset, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      title: '',
      description: '',
      servings: 2,
      ingredients: [{ name: '', amount: 0, unit: '' }],
      steps: [{ value: '' }],
      categoryIds: [],
    },
  })

  const { fields: ingredientFields, append: appendIngredient, remove: removeIngredient } = useFieldArray({ control, name: 'ingredients' })
  const { fields: stepFields, append: appendStep, remove: removeStep, move: moveStep } = useFieldArray({ control, name: 'steps' })

  const selectedCategoryIds = watch('categoryIds')

  // Populate form when editing an existing recipe
  useEffect(() => {
    if (existing) {
      reset({
        title: existing.title,
        description: existing.description ?? '',
        servings: existing.servings,
        prepTimeMinutes: existing.prepTimeMinutes ?? undefined,
        cookTimeMinutes: existing.cookTimeMinutes ?? undefined,
        ingredients: existing.ingredients.map((i) => ({ name: i.name, amount: i.amount, unit: i.unit })),
        steps: existing.steps.map((value) => ({ value })),
        categoryIds: existing.categories.map((c) => c.id),
      })
    }
  }, [existing, reset])

  const toggleCategory = (categoryId: string) => {
    if (selectedCategoryIds.includes(categoryId)) {
      setValue('categoryIds', selectedCategoryIds.filter((id) => id !== categoryId))
    } else {
      setValue('categoryIds', [...selectedCategoryIds, categoryId])
    }
  }

  const handleAddCategory = async () => {
    const name = newCategoryName.trim()
    if (!name) return
    try {
      const created = await createCategory({ name }).unwrap()
      setValue('categoryIds', [...selectedCategoryIds, created.id])
      setNewCategoryName('')
      setCategoryError('')
    } catch {
      setCategoryError('Failed to create category')
    }
  }

  const onSubmit = async (data: FormValues) => {
    const payload = {
      title: data.title,
      description: data.description || undefined,
      servings: data.servings,
      prepTimeMinutes: data.prepTimeMinutes,
      cookTimeMinutes: data.cookTimeMinutes,
      ingredients: data.ingredients,
      steps: data.steps.map((s) => s.value),
      categoryIds: data.categoryIds,
    }

    if (isEdit && id) {
      await updateRecipe({ id, body: payload }).unwrap()
      navigate(`/recipes/${id}`)
    } else {
      const created = await createRecipe(payload).unwrap()
      navigate(`/recipes/${created.id}`)
    }
  }

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(isEdit ? `/recipes/${id}` : '/recipes')}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft size={20} />
        </button>
        <h1 className="text-xl font-semibold">{isEdit ? 'Edit recipe' : 'New recipe'}</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic fields */}
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Title *</label>
            <input className={inputClass} {...register('title')} />
            {errors.title && <p className={errorClass}>{errors.title.message}</p>}
          </div>

          <div>
            <label className="text-sm font-medium">Description</label>
            <textarea
              className={`${inputClass} resize-none`}
              rows={2}
              {...register('description')}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-sm font-medium">Servings *</label>
              <input
                type="number"
                min={1}
                className={inputClass}
                {...register('servings', { valueAsNumber: true })}
              />
              {errors.servings && <p className={errorClass}>{errors.servings.message}</p>}
            </div>
            <div>
              <label className="text-sm font-medium">Prep (min)</label>
              <input
                type="number"
                min={0}
                className={inputClass}
                {...register('prepTimeMinutes', { valueAsNumber: true })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Cook (min)</label>
              <input
                type="number"
                min={0}
                className={inputClass}
                {...register('cookTimeMinutes', { valueAsNumber: true })}
              />
            </div>
          </div>
        </div>

        {/* Ingredients */}
        <div>
          <h2 className="font-medium mb-2">Ingredients *</h2>
          {errors.ingredients?.root && (
            <p className={errorClass}>{errors.ingredients.root.message}</p>
          )}
          {errors.ingredients?.message && (
            <p className={errorClass}>{errors.ingredients.message}</p>
          )}
          <div className="space-y-2">
            {ingredientFields.map((field, index) => (
              <div key={field.id} className="flex gap-2 items-start">
                <div className="flex-1">
                  <input
                    placeholder="Name"
                    className={inputClass}
                    {...register(`ingredients.${index}.name`)}
                  />
                  {errors.ingredients?.[index]?.name && (
                    <p className={errorClass}>{errors.ingredients[index].name.message}</p>
                  )}
                </div>
                <div className="w-20">
                  <input
                    type="number"
                    placeholder="Amount"
                    min={0}
                    step="any"
                    className={inputClass}
                    {...register(`ingredients.${index}.amount`, { valueAsNumber: true })}
                  />
                  {errors.ingredients?.[index]?.amount && (
                    <p className={errorClass}>{errors.ingredients[index].amount.message}</p>
                  )}
                </div>
                <div className="w-20">
                  <input
                    placeholder="Unit"
                    className={inputClass}
                    {...register(`ingredients.${index}.unit`)}
                  />
                  {errors.ingredients?.[index]?.unit && (
                    <p className={errorClass}>{errors.ingredients[index].unit.message}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removeIngredient(index)}
                  disabled={ingredientFields.length === 1}
                  className="mt-2 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-30"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => appendIngredient({ name: '', amount: 0, unit: '' })}
            className="mt-2 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Plus size={14} /> Add ingredient
          </button>
        </div>

        {/* Steps */}
        <div>
          <h2 className="font-medium mb-2">Steps *</h2>
          {errors.steps?.message && (
            <p className={errorClass}>{errors.steps.message}</p>
          )}
          <div className="space-y-2">
            {stepFields.map((field, index) => (
              <div key={field.id} className="flex gap-2 items-start">
                <span className="mt-2.5 text-sm text-muted-foreground font-medium tabular-nums w-5 shrink-0 text-right">
                  {index + 1}.
                </span>
                <div className="flex-1">
                  <textarea
                    className={`${inputClass} resize-none`}
                    rows={2}
                    placeholder={`Step ${index + 1}`}
                    {...register(`steps.${index}.value`)}
                  />
                  {errors.steps?.[index]?.value && (
                    <p className={errorClass}>{errors.steps[index].value.message}</p>
                  )}
                </div>
                <div className="flex flex-col gap-1 mt-1.5">
                  <button
                    type="button"
                    onClick={() => moveStep(index, index - 1)}
                    disabled={index === 0}
                    className="text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30"
                  >
                    <ChevronUp size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveStep(index, index + 1)}
                    disabled={index === stepFields.length - 1}
                    className="text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30"
                  >
                    <ChevronDown size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeStep(index)}
                    disabled={stepFields.length === 1}
                    className="text-muted-foreground hover:text-destructive transition-colors disabled:opacity-30"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => appendStep({ value: '' })}
            className="mt-2 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Plus size={14} /> Add step
          </button>
        </div>

        {/* Categories */}
        <div>
          <h2 className="font-medium mb-2">Categories</h2>
          {allCategories.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {allCategories.map((c) => {
                const selected = selectedCategoryIds.includes(c.id)
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggleCategory(c.id)}
                    className={`rounded-full px-3 py-1 text-sm border transition-colors ${
                      selected
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background text-foreground border-border hover:bg-accent'
                    }`}
                  >
                    {c.name}
                  </button>
                )
              })}
            </div>
          )}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="New category…"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddCategory() } }}
              className={`${inputClass} flex-1`}
            />
            <button
              type="button"
              onClick={handleAddCategory}
              className="rounded-md border px-3 py-2 text-sm hover:bg-accent transition-colors"
            >
              Add
            </button>
          </div>
          {categoryError && <p className={errorClass}>{categoryError}</p>}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-md bg-primary text-primary-foreground px-4 py-2.5 text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? 'Saving…' : isEdit ? 'Save changes' : 'Create recipe'}
        </button>
      </form>
    </div>
  )
}
