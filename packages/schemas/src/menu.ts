import { z } from 'zod'

export const DayOfWeekSchema = z.enum([
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
])

export const MealTypeSchema = z.enum(['Breakfast', 'Lunch', 'Dinner'])

export const MenuEntrySchema = z.object({
  id: z.string().uuid().optional(),
  day: DayOfWeekSchema,
  mealType: MealTypeSchema,
  recipeId: z.string().uuid(),
})

export const WeeklyMenuSchema = z.object({
  id: z.string().uuid().optional(),
  weekStart: z.string().date(),
  entries: z.array(MenuEntrySchema),
})

// Response types — what the API returns
export const MenuEntryResponseSchema = z.object({
  id: z.string().uuid(),
  day: DayOfWeekSchema,
  mealType: MealTypeSchema,
  recipeId: z.string().uuid(),
  recipeTitle: z.string(),
})

export const WeeklyMenuResponseSchema = z.object({
  weekStart: z.string().date(),
  entries: z.array(MenuEntryResponseSchema),
})

export type DayOfWeek = z.infer<typeof DayOfWeekSchema>
export type MealType = z.infer<typeof MealTypeSchema>
export type MenuEntry = z.infer<typeof MenuEntrySchema>
export type WeeklyMenu = z.infer<typeof WeeklyMenuSchema>
export type MenuEntryResponse = z.infer<typeof MenuEntryResponseSchema>
export type WeeklyMenuResponse = z.infer<typeof WeeklyMenuResponseSchema>
