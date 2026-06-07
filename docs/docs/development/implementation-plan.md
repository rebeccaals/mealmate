---
sidebar_position: 4
---

# Implementation Plan

A thorough plan of everything that needs to be built, in order. Each step depends on the previous one being done first.

---

## Step 1 — Migrations & seeding ✅ Done

- EF Core migrations created and applied (all database tables exist)
- Two users seeded: Rebecca (rebecca_div@outlook.com) and Nicolay (nicolovli@gmail.com)
- Temporary password for both: `Mealmate1`

---

## Step 2 — Authentication ✅ Done

**Decisions made:**
- User object stored in localStorage alongside token (so display name survives page refresh)
- JWT expiry: 7 days
- All 401 responses → logout + redirect to `/login` (hook in RTK Query's `baseQuery` for future refresh token flow)

This is the login flow. Without it, nothing in the app is accessible.

### Backend: Login endpoint

Create `backend/Controllers/AuthController.cs` with a single endpoint:

- `POST /api/auth/login`
  - Accepts: `{ email, password }`
  - Validates using FluentValidation (email format, password not empty)
  - Uses ASP.NET Core Identity's `SignInManager` to verify credentials
  - If valid: generates a JWT token and returns `{ token, user: { id, email, displayName } }`
  - If invalid: returns `401 Unauthorized`

The JWT token is what the frontend stores and sends with every subsequent request to prove who you are.

### Frontend: Login page

Update `frontend/src/pages/LoginPage.tsx`:

- Form with email and password fields
- Uses React Hook Form + Zod validation (from `@mealmate/schemas`)
- On submit: calls the login endpoint via RTK Query
- On success: dispatches `setCredentials` to the Redux auth slice (stores token + user in state and localStorage)
- On failure: shows an error message ("Invalid email or password")
- After login: redirects to `/recipes`

### Frontend: Auth API slice

Create `frontend/src/features/auth/authApi.ts`:

- RTK Query endpoint for `POST /api/auth/login`
- Injected into the base API

### What "done" looks like

You can open the app, type your email and password, and land on the recipes page. Refreshing the page keeps you logged in (token persists in localStorage). Closing and reopening the browser keeps you logged in.

---

## Step 3 — Categories ✅ Done

**Decisions made:**
- DELETE blocked with 409 Conflict if any recipes use the category

Simple CRUD. Good warm-up before recipes (which are more complex).

### Backend

Create `backend/Controllers/CategoriesController.cs`:

- `GET /api/categories` — list all categories
- `POST /api/categories` — create a new category `{ name }`
- `PUT /api/categories/{id}` — rename a category
- `DELETE /api/categories/{id}` — delete a category (only if no recipes use it)

Add a FluentValidation validator for the create/update request.

### Frontend

No dedicated categories page — categories are managed inline when adding/editing a recipe. But we need the RTK Query endpoints wired up:

Create `frontend/src/features/categories/categoriesApi.ts`:

- `getCategories` query
- `createCategory` mutation
- `updateCategory` mutation
- `deleteCategory` mutation

### What "done" looks like

Categories can be created and listed via Swagger UI. The frontend has the API wired up ready for use in the recipe form.

---

## Step 4 — Recipes ✅ Done

**Decisions made:**
- Ingredients deleted and recreated on every PUT (no update-in-place)
- Recipe form is full-page routes (`/recipes/new`, `/recipes/:id/edit`), not a modal
- Inline category creation fires immediately (`POST /api/categories`) rather than deferring to recipe save

The core feature. More complex than categories because a recipe has ingredients (a list), steps (a list), and a many-to-many relationship with categories.

### Backend

Create `backend/Controllers/RecipesController.cs`:

- `GET /api/recipes` — list all recipes (title, description, categories — not full ingredient list)
- `GET /api/recipes/{id}` — get a single recipe with full details (ingredients, steps, categories)
- `POST /api/recipes` — create a recipe
- `PUT /api/recipes/{id}` — update a recipe (full replace)
- `DELETE /api/recipes/{id}` — delete a recipe

The create/update body:
```json
{
  "title": "Pasta carbonara",
  "description": "Classic Roman pasta",
  "servings": 2,
  "prepTimeMinutes": 10,
  "cookTimeMinutes": 20,
  "ingredients": [
    { "name": "Spaghetti", "amount": 200, "unit": "g" },
    { "name": "Egg yolks", "amount": 4, "unit": "pcs" }
  ],
  "steps": [
    "Boil salted water",
    "Cook pasta al dente",
    "Mix egg yolks with cheese"
  ],
  "categoryIds": ["uuid-of-category"]
}
```

Record `createdById` from the JWT token (the logged-in user).

Add DTOs (Data Transfer Objects — the shapes of data sent to/from the API) and FluentValidation validators.

### Frontend

Update `frontend/src/pages/RecipesPage.tsx`:

- List of all recipes as cards (title, description snippet, category tags)
- "Add recipe" button that opens a form

Create `frontend/src/pages/RecipeDetailPage.tsx`:

- Full recipe view: title, description, servings, times, ingredients, steps
- "Edit" and "Delete" buttons (with confirmation for delete)

Create `frontend/src/components/recipes/RecipeForm.tsx`:

- Used for both creating and editing
- Fields: title, description, servings, prep time, cook time
- Dynamic ingredient list (add/remove rows, each with name, amount, unit)
- Dynamic steps list (add/remove, reorder)
- Category selector (multi-select from existing categories, with option to create a new one inline)
- Uses React Hook Form + Zod (`RecipeSchema` from `@mealmate/schemas`)

Create `frontend/src/features/recipes/recipesApi.ts`:

- `getRecipes` query
- `getRecipe` query (single)
- `createRecipe` mutation
- `updateRecipe` mutation
- `deleteRecipe` mutation

### What "done" looks like

You can add a recipe with ingredients, steps, and categories. You can see all your recipes in a list, open one to read it, edit it, and delete it.

---

## Step 5 — Weekly menu

Plan meals for each day of the week. Depends on recipes being done first (you need recipes to plan with).

### Backend

Create `backend/Controllers/MenuController.cs`:

- `GET /api/menu?weekStart=2026-06-08` — get the menu for a given week (Monday's date)
- `POST /api/menu/{weekStart}/entries` — add a recipe to a slot `{ day, mealType, recipeId }`
- `DELETE /api/menu/{weekStart}/entries/{entryId}` — remove a recipe from a slot

If no menu exists for that week yet, `GET` returns an empty structure (7 days × 3 meal types, all empty).

### Frontend

Update `frontend/src/pages/MenuPage.tsx`:

- Week selector (previous/next week navigation, showing the week's Monday date)
- 7-column grid (Mon–Sun), 3 rows (Breakfast, Lunch, Dinner)
- Each cell shows the recipe assigned to it (or is empty)
- Tapping an empty cell opens a recipe picker (search/scroll through your recipes)
- Tapping a filled cell shows options: view recipe, remove from menu

### What "done" looks like

You can navigate to any week and plan which recipe you're having for each meal. The grid shows what's planned, with empty slots clearly visible.

---

## Step 6 — Shopping list

Generated from the weekly menu. The most algorithmically interesting feature.

### Backend

Create `backend/Controllers/ShoppingListController.cs`:

- `POST /api/shopping/generate?weekStart=2026-06-08` — generate a shopping list from the menu for that week
  - Collects all ingredients from all recipes in all menu entries
  - Groups by ingredient name (case-insensitive)
  - Combines amounts with the same unit (200g + 300g = 500g)
  - Converts compatible units before combining (500g + 1kg = 1.5kg)
  - Saves the result as a `ShoppingList` with `ShoppingItem` rows
  - Returns the full list

- `GET /api/shopping?weekStart=2026-06-08` — get the current shopping list for a week

- `PATCH /api/shopping/items/{id}/check` — check or uncheck an item
  - Records `checkedById` (who checked it) and `checkedAt`

- `POST /api/shopping/items` — manually add an item to the list `{ name, amount, unit }`
  - Records `addedById`

- `DELETE /api/shopping/items/{id}` — remove a manually added item

Create `backend/Services/ShoppingListService.cs` — unit combining logic lives here. This is a good candidate for xUnit tests.

### Unit combining logic

The service needs a conversion table, for example:
- Weight: mg, g, kg (1kg = 1000g, 1g = 1000mg)
- Volume: ml, dl, l (1l = 10dl = 1000ml)
- Items: pcs, stk (treat as same)

Steps:
1. Group ingredients by name (case-insensitive, trimmed)
2. Within each group, try to convert all amounts to a common base unit
3. Sum them up
4. Format back to a readable unit (e.g. 1500g → 1.5kg)

If units can't be converted (e.g. "2 cloves" + "1 bulb"), keep them as separate items.

### Frontend

Update `frontend/src/pages/ShoppingPage.tsx`:

- Shows the shopping list for the current week
- "Generate list" button (or auto-generated when navigating to the page)
- Items grouped or listed with checkboxes
- Checked items shown with strikethrough and the name of who checked them ("✓ Checked by Nicolay")
- "Add item manually" — a small form at the bottom (name, amount, unit)
- Items added manually show who added them

### What "done" looks like

After planning your week's menu, you tap "Generate list" on the shopping page. A combined list appears. At the store, you check items off as you put them in the basket. Your partner sees the same list and can check things off from their phone simultaneously (on next refresh).

---

## Step 7 — Polish & quality of life

Small improvements once all features work:

- **Change password** — a simple form so you don't have to keep using `Mealmate1`
- **Recipe search/filter** — filter by category or search by title
- **Serving size scaler** — "this recipe is for 2, I need 4" adjusts ingredient amounts
- **PWA manifest** — so the app can be installed to the iPhone home screen
- **Loading states** — skeleton loaders while data is fetching
- **Empty states** — friendly messages when there are no recipes/items yet

---

## Step 8 — Deploy to Railway

When the app is working well locally:

1. Create a Railway project
2. Add a PostgreSQL plugin (Railway hosts the database)
3. Connect the GitHub repo — Railway auto-deploys on push to `main`
4. Set environment variables in Railway: `Jwt__Key`, database connection string
5. Configure Railway to use the Dockerfiles
6. Update `frontend/nginx.conf` if needed for production routing
7. Add a GitHub Actions workflow step to run migrations on deploy

### What "done" looks like

The app is live on a Railway URL. You and Nicolay can access it from your iPhones without running anything on your Mac.

---

## Future ideas (not planned yet)

- Server-sent events or WebSockets for real-time shopping list sync
- SSR with Next.js
- Recipe photo uploads
- Meal history / archive of past weeks
- Nutrition info (if you want to go there)
- Sharing recipes as a link
