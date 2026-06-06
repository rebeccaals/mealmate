import { z } from 'zod'

export const ShoppingItemSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  amount: z.number().positive(),
  unit: z.string().min(1),
  isChecked: z.boolean(),
  checkedById: z.string().optional(),
  checkedByName: z.string().optional(),
  checkedAt: z.string().datetime().optional(),
})

export const ShoppingListSchema = z.object({
  id: z.string().uuid(),
  weeklyMenuId: z.string().uuid(),
  generatedAt: z.string().datetime(),
  items: z.array(ShoppingItemSchema),
})

export type ShoppingItem = z.infer<typeof ShoppingItemSchema>
export type ShoppingList = z.infer<typeof ShoppingListSchema>
