---
sidebar_position: 2
---

# Data Model

## Entity overview

```
AppUser
  id, email, displayName

Recipe
  id, title, description, servings
  prepTimeMinutes?, cookTimeMinutes?
  steps[]
  createdById → AppUser
  ingredients[] → Ingredient
  categories[] ↔ Category (many-to-many)

Ingredient
  id, name, amount, unit
  recipeId → Recipe

Category
  id, name
  recipes[] ↔ Recipe (many-to-many)

WeeklyMenu
  id, weekStart (Monday's date)
  entries[] → MenuEntry

MenuEntry
  id, day (0=Sun…6=Sat), mealType (Breakfast|Lunch|Dinner)
  weeklyMenuId → WeeklyMenu
  recipeId → Recipe

ShoppingList
  id, weeklyMenuId → WeeklyMenu, generatedAt
  items[] → ShoppingItem

ShoppingItem
  id, name, amount, unit
  isChecked, checkedById? → AppUser, checkedAt?
  shoppingListId → ShoppingList
```

## Shopping list generation

When a shopping list is generated from a weekly menu:

1. Collect all ingredients from all recipes in all menu entries
2. Group by ingredient name (case-insensitive)
3. Within each group, combine items with the same unit by summing amounts
4. For items with different units (e.g. grams and kg), convert to a common unit before summing
5. Write the combined items to the `ShoppingItem` table
