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

## Step 5 — Weekly menu ✅ Done

**Decisions made:**
- Assigning a recipe to a filled slot replaces the existing entry silently
- Non-Monday weekStart rejected with 400
- `WeeklyMenu` row created lazily on first POST (not on GET)
- All enums serialized as strings throughout (fixed pre-existing bug where MealType would have serialized as integers)

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

> **Re-planned 2026-11-27** after a grilling session. Domain terms are defined in [CONTEXT.md](https://github.com/rebeccaals/mealmate/blob/main/CONTEXT.md); naming follows [ADR-005](../decisions/adr-005-norwegian-domain-terms.md). The original steps 6–8 (shopping list per week, polish, deploy last) are replaced by the steps below.

## Step 6 — Rename to Norwegian domain terms ✅ Done

**Decisions made:**
- Domain *properties* are Norwegian too, not just class names (`Tittel`, `Porsjoner`, `Steg`, `Ingredienser`, `OpprettetAv`, `KategoriIder`) — so JSON fields are Norwegian as well
- `ForberedelsestidMinutter` / `TilberedningstidMinutter` keep the unit in the name
- `Dag` still uses .NET's `DayOfWeek` (English names over the wire); the frontend maps them to Norwegian labels
- `ShoppingList`/`ShoppingItem` deleted rather than renamed — rebuilt from scratch in step 10
- `MenuEntry` renamed to `Måltid` (still one oppskrift per måltid until step 8); routes `/api/ukesmeny/{ukestart}/maltider`
- Migrations deleted and recreated as a single `InitialCreate`
- `Kvelds` deliberately left for step 8
- Backend applies pending migrations on startup (`MigrateAsync()` before seeding) — an empty database no longer crashes the seeder, and deploy doesn't need a separate migration step


Before deploy, while there is no real data. See ADR-005.

- `Recipe` → `Oppskrift`, `Ingredient` → `Ingrediens`, `Category` → `Kategori`, `WeeklyMenu` → `Ukesmeny`, `MealType` → `Måltidstype` (`Frokost`, `Lunsj`, `Middag`, `Kvelds`), etc.
- Controllers, DTOs, validators, Zod schemas, RTK Query endpoints and frontend types follow.
- Routes in ASCII: `/api/oppskrifter`, `/api/ukesmeny`, `/api/maltider`.
- Delete and recreate migrations (no data to keep).
- UI text in Norwegian.
- Update [data-model.md](../architecture/data-model.md) to the Norwegian names, and keep it current in steps 8–10 as the ukesmeny, butikkvare and handleliste models change.

**Done when:** the app works exactly as before, with Norwegian domain names everywhere.

## Step 7 — Deploy to Railway (+ PWA) — code ready, Railway setup pending

**Decisions made:**
- Only the frontend is public; nginx forwards `/api/*` to the backend over Railway's private network — one origin, no CORS needed in production
- nginx config is a template (`PORT`, `BACKEND_URL` from env) so the same image works in docker compose and on Railway
- No secrets in `appsettings.json`: JWT key, connection string and seed passwords live in `appsettings.Development.json` locally and env vars in production; backend refuses to start without `Jwt:Key`
- Seed passwords from config (`SeedPasswords__Rebecca` / `__Nicolay`) instead of hard-coded `Mealmate1` — so "change password" can stay in step 11
- PWA without a service worker: manifest + apple-touch-icon is enough for "Legg til på Hjem-skjerm" on iOS
- Setup guide: [Deploy to Railway](deploy-railway.md)


Moved forward so the app can be used while the rest is built.

1. Railway project + PostgreSQL plugin, auto-deploy from `main`
2. Env vars: `Jwt__Key`, connection string
3. Dockerfiles, `frontend/nginx.conf` for production routing
4. ~~Run migrations on deploy (GitHub Actions)~~ — not needed: the backend migrates on startup (see step 6)
5. PWA manifest + icons so the app can be added to the iPhone home screen

From here on, every model change is a normal EF Core migration — never recreate migrations again.

**Done when:** both of you can open the app on your phones and add oppskrifter.

## Step 8 — New ukesmeny model

- Add `Kvelds` to `Måltidstype`.
- `Måltid` = dag + måltidstype + `Porsjoner` (default 2) + 0..n oppskrifter (many-to-many, EF Core skip navigation) + optional `Notat`. One måltid per dag + måltidstype.
- Replaces `MenuEntry` (one recipe per slot, silently overwritten).
- UI: tap a måltid → add/remove oppskrifter, set porsjoner, write notat.

**Done when:** tirsdag middag can hold kyllinggryte + ris + salat for 4, and onsdag middag can be just "Rester".

## Step 9 — Butikkvarer, avdelinger and ingredient parsing

- `Butikkvare` (name, `Avdeling`), shared by oppskrifter and handleliste. Fixed list of avdelinger.
- `Ingrediens` = butikkvare + amount + `Enhet` (fixed list: g, kg, ml, dl, l, ts, ss, stk, fedd, pakke, boks, klype).
- One free-text field per ingredient: `2 ss smør` → **2** · **ss** · **Smør ✓**. Handles `0,5`, `1/2`, `½`, unit synonyms (*spiseskje* → ss), missing unit → stk, missing amount → no amount. Unknown butikkvare → "Ny vare: Smør?" (asks for avdeling).
- Paste a whole ingredient list (one per line) and parse all at once.
- Parser is a pure TypeScript function in `packages/schemas` — unit test it thoroughly.
- "Butikkvarer" page: edit, set avdeling, merge duplicates, bulk add (one per line).

**Done when:** writing an oppskrift with 10 ingredients is one paste or ten quick lines, with no dropdowns.

## Step 10 — Handleliste

One shared, ongoing handleliste. See CONTEXT.md for vare, kilde, avkrysset.

- "Legg i handlelisten" from: the ukesmeny, selected days, a single måltid, an oppskrift (with porsjoner), or manually.
- Each `Vare` = butikkvare + list of `Kilde` (måltid / oppskrift / manual) with their amounts. The vare's amount is the sum.
- Summing: convert within the same kind (g/kg, ml/dl/l); different kinds shown side by side ("Smør 250 g + 2 ss"). Combining logic in a service with xUnit tests.
- **Automatic sync:** when a måltid changes (porsjoner, oppskrifter added/removed), its kilder are updated — but only on varer that are not avkrysset. A vare reaching 0 is removed. Avkryssede varer are never changed; a mismatch is shown instead.
- Adding a whole week twice doesn't double anything — a måltid is a kilde at most once.
- Ukesmeny shows per måltid: not on list / 🛒 on list / 🛒⚠ avkrysset vare no longer matches.
- Tap a vare to see its kilder ("til kyllinggryten tirsdag").
- Grouped by avdeling, in an adjustable order.
- Check off records who and when (ADR-004). "Fjern handlede varer" clears avkryssede.
- Polling every 5 s while the handleliste page is open (RTK Query `pollingInterval`). Real-time (SignalR) only if polling proves insufficient.

**Done when:** you plan the week, tap "Legg uken i handlelisten", and in the store you both see one list grouped by avdeling that stays in sync.

## Step 11 — Polish & quality of life

- Change password
- Recipe search/filter by kategori or title
- Loading and empty states

---

## Future ideas (not planned yet)

- **Delmåltid** — per-oppskrift porsjoner within a måltid (e.g. tirsdag middag: kyllinggryte ×2, ris ×4, salat ×1). Today porsjoner live on the måltid; if that proves too coarse, introduce *Delmåltid* (måltid → delmåltider → oppskrift + porsjoner) and move porsjoner there.

- Server-sent events or WebSockets (SignalR) for real-time handleliste sync — polling (5 s) used until it proves insufficient
- SSR with Next.js
- Recipe photo uploads
- Meal history / archive of past weeks
- Nutrition info (if you want to go there)
- Sharing recipes as a link
