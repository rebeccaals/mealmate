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

export type DayOfWeek = z.infer<typeof DayOfWeekSchema>
export type MealType = z.infer<typeof MealTypeSchema>
export type MenuEntry = z.infer<typeof MenuEntrySchema>
export type WeeklyMenu = z.infer<typeof WeeklyMenuSchema>
