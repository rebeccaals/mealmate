---
sidebar_position: 5
---

# Codebase Guide

What each file does, in plain language. Updated as new files are added.

---

## Backend (`backend/`)

### `Program.cs`

The entry point and bootstrap file for the entire backend. This is where the app is configured before it starts.

It does four things in order:

1. **Registers services** — tells ASP.NET what's available for injection. This includes the database (`AppDbContext`), Identity (user/password management), JWT authentication, FluentValidation, Swagger, and CORS (which allows the frontend on port 3000 to talk to the backend on port 5001).
2. **Builds the app** — once all services are registered, `builder.Build()` locks them in.
3. **Seeds the database** — runs `DataSeeder` on every startup, creating Rebecca and Nicolay's accounts if they don't exist yet.
4. **Configures the middleware pipeline** — the order here matters. Every HTTP request passes through: CORS → Authentication → Authorization → Controllers.

You rarely need to touch this file except when adding a new service or changing the pipeline.

---

### `Controllers/AuthController.cs`

Handles the login flow. Contains three things:

- **`LoginRequest`** — a simple record with `Email` and `Password`. This is the shape of the JSON the frontend sends.
- **`LoginRequestValidator`** — runs automatically before the login method. Checks that the email is valid format and the password isn't empty. If validation fails, ASP.NET returns a 400 automatically — the controller method never even runs.
- **`AuthController`** with a `POST /api/auth/login` endpoint that:
  1. Looks up the user by email
  2. Checks the password against the stored hash (ASP.NET Identity does this securely)
  3. On failure: returns 401 (deliberately doesn't say *why* — email wrong vs password wrong)
  4. On success: generates a JWT token (7-day expiry) and returns `{ token, user: { id, email, displayName } }`

The `GenerateToken` method builds the JWT — it packages the user's identity into a signed blob that the frontend stores and sends with every future request.

---

### `Models/AppUser.cs`

The user model. Extends ASP.NET Core Identity's `IdentityUser`, which already provides `Id`, `Email`, `UserName`, and password hashing. The only addition is `DisplayName` — the friendly name shown in the UI ("Rebecca", "Nicolay").

---

### `Models/Recipe.cs`

The core domain model. A recipe has:
- Basic info: `Title`, `Description`, `Servings`, `PrepTimeMinutes`, `CookTimeMinutes`
- A list of `Steps` (stored as `List<string>` — ordered text)
- A list of `Ingredients` (separate rows in the database, each with name/amount/unit)
- A many-to-many relationship with `Categories`
- `CreatedById` pointing to the `AppUser` who added it (for attribution, not access control)

---

### `Models/Ingredient.cs`

A single ingredient line on a recipe: a name, an amount, and a unit (e.g. "Pasta — 200 — g"). Always belongs to exactly one recipe via `RecipeId`. Has no independent existence outside a recipe.

---

### `Models/Category.cs`

A tag that can be applied to recipes (e.g. "Vegetarian", "Quick", "Pasta"). Has only a `Name`. Recipes and categories have a many-to-many relationship — one recipe can have many categories, and one category can belong to many recipes.

---

### `Models/WeeklyMenu.cs`

Contains two classes:

- **`WeeklyMenu`** — a week's plan, identified by `WeekStart` (always a Monday). Has a list of `MenuEntry` rows.
- **`MenuEntry`** — a single slot in the grid: which `Day` of the week, which `MealType` (Breakfast/Lunch/Dinner), and which `Recipe`. So "Tuesday dinner = Pasta carbonara" is one `MenuEntry`.

The `MealType` enum lives here too.

---

### `Models/ShoppingList.cs`

Contains two classes:

- **`ShoppingList`** — a generated list tied to a `WeeklyMenu`. Stores when it was generated (`GeneratedAt`) and a list of items.
- **`ShoppingItem`** — one row on the list: name, amount, unit. Tracks whether it's been checked off (`IsChecked`), who checked it (`CheckedById`), and when (`CheckedAt`). Manually added items and generated items live side-by-side here.

---

### `Data/AppDbContext.cs`

The database context — Entity Framework Core's representation of the database. Every table in the database has a corresponding `DbSet<T>` property here. EF Core uses this to generate SQL queries when your code does things like `context.Recipes.ToListAsync()`.

The `OnModelCreating` method configures the many-to-many join table between recipes and categories (EF Core needs to know about this explicitly).

---

### `Data/DataSeeder.cs`

Runs once on startup. Creates Rebecca and Nicolay's accounts if they don't already exist. Safe to run repeatedly — it checks first.

This is how both users got into the database without a registration flow. The starting password for both is `Mealmate1`.

---

### `Migrations/`

Auto-generated files created by the `dotnet ef migrations add` command. You never edit these by hand. Each migration file describes exactly what SQL to run to update the database schema.

`AppDbContextModelSnapshot.cs` is a snapshot of the current schema — EF Core uses it to figure out what's changed since the last migration.

---

## Frontend (`frontend/src/`)

### `main.tsx`

The true entry point of the React app. It finds the `<div id="root">` in `index.html` and mounts the app into it. It wraps everything in three providers:
- `<StrictMode>` — React development helper that surfaces subtle bugs
- `<Provider store={store}>` — makes Redux state available everywhere
- `<BrowserRouter>` — enables URL-based routing

---

### `App.tsx`

Defines the app's route structure. Two key things:

- **`ProtectedRoute`** — a wrapper that checks if a token exists in Redux state. If not, redirects to `/login`. Every authenticated page is wrapped in this.
- **Routes** — `/login` is public. Everything under `/` requires authentication and renders inside `Layout`. The root `/` redirects straight to `/recipes`.

---

### `index.css`

Global styles. Mostly Tailwind CSS setup and shadcn/ui CSS variables for theming (colors, border radius, etc.). You shouldn't need to touch this often.

---

### `app/store.ts`

Configures the Redux store — the single place where all shared state lives. Currently registers two slices:
- `auth` — authentication state (from `authSlice`)
- `api` — RTK Query's cache (from `baseApi`)

Also exports `RootState` and `AppDispatch` types, used throughout the app to keep TypeScript happy.

---

### `app/hooks.ts`

Two typed wrappers around Redux's `useSelector` and `useDispatch`. Using `useAppSelector` and `useAppDispatch` instead of the raw versions gives you autocomplete and type safety throughout the app without having to specify types at every call site.

---

### `features/api/baseApi.ts`

The foundation for all API calls in the app. Creates an RTK Query API with:
- `baseUrl: '/api'` — all requests go to `/api/...`, which Vite proxies to the backend in development
- `prepareHeaders` — attaches the JWT token to every request automatically if one exists in state
- `tagTypes` — the list of cache tags RTK Query uses to know when to refetch data (e.g. when you add a recipe, the `Recipe` tag is invalidated and the list refetches)
- `baseQueryWithReauth` — a wrapper around the base query that catches 401 responses, dispatches `logout()`, and redirects to `/login`. This is also where a refresh-token flow would plug in later.

Individual feature APIs (like `authApi`, `recipesApi`) are injected into this base.

---

### `features/auth/authSlice.ts`

Manages authentication state in Redux. Stores the JWT token and the current user object (`id`, `email`, `displayName`).

- On page load, reads both the token and user from `localStorage` so you stay logged in after a refresh
- `setCredentials` — called after a successful login; saves both token and user to state and `localStorage`
- `logout` — clears both from state and `localStorage`

---

### `components/layout/Layout.tsx`

The app shell that wraps all authenticated pages. Renders:
- A **header** at the top with the app name and a logout button
- A **`<main>`** area in the middle where the current page renders (via `<Outlet />`)
- A **bottom navigation bar** with links to Recipes, Menu, and Shopping

The bottom nav is styled for mobile — this is what makes the app feel like an iPhone app.

---

### `pages/LoginPage.tsx`

The login form. Uses React Hook Form with Zod validation — the validation rules come from `LoginSchema`, which lives in `packages/schemas/src/auth.ts` and is imported as `@mealmate/schemas` (a local package, not something downloaded from the internet). This means the email and password are validated client-side before anything is sent to the backend.

On submit it calls the `login` mutation from `authApi`. On success it dispatches `setCredentials` (saving token + user to Redux and localStorage) and navigates to `/recipes`. On failure it shows "Invalid email or password" — deliberately vague so you can't tell whether the email or password was wrong.

---

### `pages/RecipesPage.tsx`, `MenuPage.tsx`, `ShoppingPage.tsx`

Currently placeholders. Will become the main feature pages once the backend endpoints are ready.

---

## Packages (`packages/schemas/`)

### `packages/schemas/src/auth.ts`

Zod schemas for authentication:
- `LoginSchema` — validates the login form (email format, password min length). Used by React Hook Form on the frontend.
- `AuthResponseSchema` — the shape of a successful login response from the backend.

---

### `packages/schemas/src/recipe.ts`

Zod schemas for recipes and ingredients. `RecipeSchema` is used to validate the recipe creation/edit form. Shared between the frontend form validation and potentially backend validation in the future.

---

### `packages/schemas/src/menu.ts`

Zod schemas for the weekly menu and individual menu entries.

---

### `packages/schemas/src/shopping.ts`

Zod schemas for shopping lists and individual items. Note that `ShoppingItemSchema` includes `checkedByName` — a denormalized display name so the frontend can show "Checked by Nicolay" without an extra lookup.

---

### `packages/schemas/src/index.ts`

Re-exports everything from all schema files. This is why the frontend can write `import { RecipeSchema } from '@mealmate/schemas'` — one clean import, regardless of which file the schema lives in.
