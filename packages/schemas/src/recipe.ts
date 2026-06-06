import { z } from 'zod'

export const IngredientSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, 'Name is required'),
  amount: z.number().positive('Amount must be positive'),
  unit: z.string().min(1, 'Unit is required'),
})

export const RecipeSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  servings: z.number().int().positive('Servings must be at least 1'),
  prepTimeMinutes: z.number().int().nonnegative().optional(),
  cookTimeMinutes: z.number().int().nonnegative().optional(),
  ingredients: z.array(IngredientSchema).min(1, 'At least one ingredient is required'),
  steps: z.array(z.string().min(1)).min(1, 'At least one step is required'),
  categoryIds: z.array(z.string().uuid()),
})

export type Ingredient = z.infer<typeof IngredientSchema>
export type Recipe = z.infer<typeof RecipeSchema>
