import { z } from 'zod'

export const MealTypeSchema = z.enum(['Breakfast', 'Lunch', 'Dinner'])

export const MenuEntrySchema = z.object({
  id: z.string().uuid().optional(),
  day: z.number().int().min(0).max(6),
  mealType: MealTypeSchema,
  recipeId: z.string().uuid(),
})

export const WeeklyMenuSchema = z.object({
  id: z.string().uuid().optional(),
  weekStart: z.string().date(),
  entries: z.array(MenuEntrySchema),
})

export type MealType = z.infer<typeof MealTypeSchema>
export type MenuEntry = z.infer<typeof MenuEntrySchema>
export type WeeklyMenu = z.infer<typeof WeeklyMenuSchema>
