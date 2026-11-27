---
sidebar_position: 5
---

# Codebase Guide

What each file does, in plain language. Updated as new files are added.

> Domain terms (Oppskrift, Måltid, Ukesmeny …) are Norwegian in code — see [ADR-005](../decisions/adr-005-norwegian-domain-terms.md) and `CONTEXT.md` at the repo root for what each term means.

---

## Backend (`backend/`)

The backend is organized so each file has one clear responsibility: controllers handle HTTP logic, DTOs describe data shapes, validators enforce input rules, and models represent database entities. This mirrors the structure you'd typically see in a professional .NET codebase.

### `Program.cs`

The entry point and bootstrap file for the entire backend. This is where the app is configured before it starts.

It does four things in order:

1. **Registers services** — tells ASP.NET what's available for injection. This includes the database (`AppDbContext`), Identity (user/password management), JWT authentication, FluentValidation, Swagger, and CORS (which allows the frontend on port 3000 to talk to the backend on port 5001).
2. **Builds the app** — once all services are registered, `builder.Build()` locks them in.
3. **Migrates and seeds the database** — applies any pending EF Core migrations (`db.Database.MigrateAsync()`), so a fresh or empty database gets its tables automatically, then runs `DataSeeder`, creating Rebecca and Nicolay's accounts if they don't exist yet.
4. **Configures the middleware pipeline** — the order here matters. Every HTTP request passes through: CORS → Authentication → Authorization → Controllers.

You rarely need to touch this file except when adding a new service or changing the pipeline.

---

### `Controllers/UkesmenyController.cs`

Manages the weekly meal plan (ukesmeny):
- `GET /api/ukesmeny?ukestart=YYYY-MM-DD` — returns the ukesmeny for a given week; `ukestart` must be a Monday or returns 400. Returns an empty måltid list if nothing is planned yet (no DB row created).
- `POST /api/ukesmeny/{ukestart}/maltider` — puts an oppskrift on a dag + måltidstype; creates the `Ukesmeny` row lazily if this is the first måltid that week; silently replaces any existing måltid on the same dag + måltidstype.
- `DELETE /api/ukesmeny/{ukestart}/maltider/{måltidId}` — removes a single måltid.

Routes use `maltider` (ASCII) instead of `måltider` so URLs don't get percent-encoded (ADR-005).

---

### `Controllers/OppskrifterController.cs`

Full CRUD for oppskrifter, all endpoints requiring a valid JWT:
- `GET /api/oppskrifter` (`GetOppskrifter`) — list all oppskrifter (tittel, beskrivelse, kategorier, porsjoner/time info — no ingredienser)
- `GET /api/oppskrifter/{id}` (`GetOppskrift`) — full oppskrift including ingredienser and steg
- `POST /api/oppskrifter` (`CreateOppskrift`) — creates an oppskrift; records `OpprettetAvId` from the JWT
- `PUT /api/oppskrifter/{id}` (`UpdateOppskrift`) — full replace; old ingredienser are deleted and recreated from the request
- `DELETE /api/oppskrifter/{id}` (`DeleteOppskrift`) — deletes the oppskrift and cascades to its ingredienser

The data shapes (DTOs) live in `DTOs/OppskriftDtos.cs`.

---

### `Validators/LoginRequestValidator.cs`

Validates the login request — email must be a valid format, password must not be empty.

---

### `Validators/KategoriRequestValidator.cs`

Validates kategori create/update requests — `Navn` must not be empty and must be under 100 characters.

---

### `Validators/OppskriftRequestValidator.cs`

Validates oppskrift create/update requests — tittel not empty, porsjoner positive, at least one ingrediens (each with navn/mengde/enhet), at least one steg.

FluentValidation validators registered in `Program.cs` via `AddValidatorsFromAssemblyContaining<Program>()` — they run automatically before the controller method is called, returning a 400 if validation fails.

---

### `Validators/AddMåltidRequestValidator.cs`

Validates the request for putting an oppskrift on the ukesmeny — `OppskriftId` must be set.

---

### `DTOs/UkesmenyDtos.cs`

Data shapes for the ukesmeny API: `UkesmenyDto` (the full week with its måltider), `MåltidDto` (one planned måltid including the oppskrift's tittel), and `AddMåltidRequest` (what the frontend sends when putting an oppskrift on a dag + måltidstype).

---

### `DTOs/KategoriDtos.cs`

Data shapes for the kategorier API: `KategoriDto` (what the API returns) and `KategoriRequest` (what the API accepts). Kept separate from the controller so they can be shared — `KategoriDto` is used by both `KategorierController` and `OppskrifterController`.

---

### `DTOs/OppskriftDtos.cs`

Data shapes for the oppskrifter API: `OppskriftListDto`, `OppskriftDetailDto`, `IngrediensDto`, `OppskriftRequest`, and `IngrediensRequestItem`. The list and detail DTOs are different shapes — the list omits ingredienser to keep the response light.

---

### `Controllers/KategorierController.cs`

Full CRUD for kategorier, all endpoints requiring a valid JWT:
- `GET /api/kategorier` — returns all kategorier sorted alphabetically
- `POST /api/kategorier` — creates a kategori; validates navn via FluentValidation
- `PUT /api/kategorier/{id}` — renames a kategori; returns 404 if not found
- `DELETE /api/kategorier/{id}` — deletes a kategori; returns 409 Conflict if any oppskrifter use it

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

### `Models/Oppskrift.cs`

The core domain model. An oppskrift has:
- Basic info: `Tittel`, `Beskrivelse`, `Porsjoner`, `ForberedelsestidMinutter`, `TilberedningstidMinutter`
- A list of `Steg` (stored as `List<string>` — ordered text)
- A list of `Ingredienser` (separate rows in the database, each with navn/mengde/enhet)
- A many-to-many relationship with `Kategorier`
- `OpprettetAvId` pointing to the `AppUser` who added it (for attribution, not access control), and `Opprettet` (when)

---

### `Models/Ingrediens.cs`

A single ingrediens line on an oppskrift: a `Navn`, a `Mengde`, and an `Enhet` (e.g. "Pasta — 200 — g"). Always belongs to exactly one oppskrift via `OppskriftId`. Has no independent existence outside an oppskrift.

---

### `Models/Kategori.cs`

A label that can be applied to oppskrifter (e.g. "Vegetar", "Rask", "Pasta"). Has only a `Navn`. Oppskrifter and kategorier have a many-to-many relationship — one oppskrift can have many kategorier, and one kategori can belong to many oppskrifter.

---

### `Models/Ukesmeny.cs`

Contains two classes and an enum:

- **`Ukesmeny`** — a week's plan, identified by `Ukestart` (always a Monday). Has a list of `Måltider`.
- **`Måltid`** — one dag + måltidstype in the grid, and which `Oppskrift` is planned. So "tirsdag middag = Pasta carbonara" is one `Måltid`. `Dag` uses .NET's built-in `DayOfWeek`, which is why it's serialized as English day names ("Tuesday").
- **`Måltidstype`** — `Frokost`, `Lunsj`, `Middag`.

---

### `Data/AppDbContext.cs`

The database context — Entity Framework Core's representation of the database. Every table in the database has a corresponding `DbSet<T>` property here. EF Core uses this to generate SQL queries when your code does things like `db.Oppskrifter.ToListAsync()`.

The `OnModelCreating` method configures the many-to-many join table between oppskrifter and kategorier (`KategoriOppskrift`) (EF Core needs to know about this explicitly).

---

### `Data/DataSeeder.cs`

Runs once on startup. Creates Rebecca and Nicolay's accounts if they don't already exist. Safe to run repeatedly — it checks first.

This is how both users got into the database without a registration flow. The passwords come from configuration (`SeedPasswords:Rebecca` / `SeedPasswords:Nicolay`): `Mealmate1` locally via `appsettings.Development.json`, and real passwords from Railway env vars in production. If a password is missing or rejected by Identity's rules, startup fails with a clear error instead of silently skipping the user.

---

### `appsettings.json` / `appsettings.Development.json`

Configuration files. `appsettings.json` holds only settings that are safe everywhere (JWT issuer/audience, logging). Secrets and local-only values — the local connection string, a dev JWT key, and the dev seed passwords — live in `appsettings.Development.json`, which is only loaded when `ASPNETCORE_ENVIRONMENT=Development`. In production these come from environment variables (e.g. `Jwt__Key`; the double underscore means "nested key", so it maps to `Jwt:Key`). If `Jwt:Key` is missing, the backend refuses to start rather than falling back to a known key.

---

### `Dockerfile` (backend)

Builds the backend in two stages: the .NET SDK image compiles and publishes the app, then only the published output is copied into the much smaller ASP.NET runtime image. Sets `ASPNETCORE_URLS=http://+:5001` so it listens on port 5001 on all network interfaces (including IPv6, which Railway's private network uses).

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
- **Routes** — `/login` is public. Everything under `/` requires authentication and renders inside `Layout`. The root `/` redirects straight to `/oppskrifter`. Routes are Norwegian: `/oppskrifter`, `/oppskrifter/ny`, `/oppskrifter/:id`, `/oppskrifter/:id/rediger`, `/ukesmeny`, `/handleliste`.

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
- `tagTypes` — the list of cache tags RTK Query uses to know when to refetch data (e.g. when you add an oppskrift, the `Oppskrift` tag is invalidated and the list refetches). Tags: `Oppskrift`, `Kategori`, `Ukesmeny`
- `baseQueryWithReauth` — a wrapper around the base query that catches 401 responses, dispatches `logout()`, and redirects to `/login`. This is also where a refresh-token flow would plug in later.

Individual feature APIs (like `authApi`, `oppskrifterApi`) are injected into this base.

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
- A **bottom navigation bar** with links to Oppskrifter, Ukesmeny, and Handleliste

The bottom nav is styled for mobile — this is what makes the app feel like an iPhone app.

---

### `features/ukesmeny/ukesmenyApi.ts`

RTK Query endpoints for the ukesmeny: `useGetUkesmenyQuery` (fetch a week's måltider), `useAddMåltidMutation` (put an oppskrift on a dag + måltidstype), and `useRemoveMåltidMutation` (remove a måltid).

---

### `pages/UkesmenyPage.tsx`

The weekly meal planner. Shows a 7-column (man–søn) × 3-row (Frokost/Lunsj/Middag) grid for the current week. Prev/next buttons navigate between weeks.

Tapping a måltid opens a panel at the bottom of the screen:
- **Empty** — shows an oppskrift picker (scrollable list of all oppskrifter)
- **Filled** — shows the oppskrift's tittel with "Se oppskrift" and "Fjern" options

The API sends days as English `DayOfWeek` names; `DAGNAVN` maps them to Norwegian for display. Week state is local (not in Redux) — navigating away and back resets to the current week.

---

### `features/oppskrifter/oppskrifterApi.ts`

RTK Query endpoints for oppskrifter. Provides hooks for every operation:
- `useGetOppskrifterQuery` — fetches the list (used on OppskrifterPage and UkesmenyPage)
- `useGetOppskriftQuery` — fetches a single oppskrift by ID (used on OppskriftDetailPage and OppskriftForm in edit mode)
- `useCreateOppskriftMutation` — creates an oppskrift
- `useUpdateOppskriftMutation` — updates an oppskrift (full replace)
- `useDeleteOppskriftMutation` — deletes an oppskrift

---

### `features/kategorier/kategorierApi.ts`

RTK Query endpoints for kategorier. Provides four hooks used by the oppskrift form:
- `useGetKategorierQuery` — fetches all kategorier, sorted alphabetically
- `useCreateKategoriMutation` — creates a new kategori
- `useUpdateKategoriMutation` — renames a kategori
- `useDeleteKategoriMutation` — deletes a kategori (the backend rejects this if any oppskrifter use it)

All mutations invalidate the `Kategori` cache tag, so any component using `useGetKategorierQuery` automatically refetches after a change.

---

### `pages/OppskrifterPage.tsx`

The oppskrift list. Shows all oppskrifter as cards (tittel, beskrivelse snippet, porsjoner, total time, kategorier). Tapping a card navigates to the detail page. The "Ny oppskrift" button navigates to `/oppskrifter/ny`.

---

### `pages/OppskriftDetailPage.tsx`

Full oppskrift view: tittel, beskrivelse, porsjoner, times, kategorier, ingrediensliste, and numbered steg ("Fremgangsmåte"). Has Rediger (navigates to `/oppskrifter/:id/rediger`) and Slett (with confirmation dialog) buttons.

---

### `components/oppskrifter/OppskriftForm.tsx`

Used for both creating (`/oppskrifter/ny`) and editing (`/oppskrifter/:id/rediger`). Detects its mode from the URL — if there's an `:id` param, it fetches the oppskrift and pre-fills the form.

Key parts:
- Basic fields (tittel, beskrivelse, porsjoner, forberedelse/tilberedning in minutes)
- **Ingredienser** — dynamic list using React Hook Form's `useFieldArray`; each row has navn, mengde, enhet, and a remove button
- **Steg** — dynamic list with up/down reorder buttons and remove; stored internally as `{ value }` objects (React Hook Form requires objects for field arrays), transformed to plain strings on submit
- **Kategorier** — toggle buttons for existing kategorier; inline "Ny kategori" input that immediately calls `POST /api/kategorier` and adds the new ID to the selection

---

### `pages/LoginPage.tsx`

The login form. Uses React Hook Form with Zod validation — the validation rules come from `LoginSchema`, which lives in `packages/schemas/src/auth.ts` and is imported as `@mealmate/schemas` (a local package, not something downloaded from the internet). This means the email and password are validated client-side before anything is sent to the backend.

On submit it calls the `login` mutation from `authApi`. On success it dispatches `setCredentials` (saving token + user to Redux and localStorage) and navigates to `/oppskrifter`. On failure it shows "Feil e-post eller passord" — deliberately vague so you can't tell whether the email or password was wrong.

---

### `pages/HandlelistePage.tsx`

Placeholder for the handleliste. Will be built in step 10 (see ADR-006).

---

### `frontend/public/manifest.webmanifest` and icons

Makes the app installable as a PWA: name, start URL, `display: standalone` (opens without Safari's address bar) and theme colour. The icons are `icon-192.png` / `icon-512.png` (manifest), `apple-touch-icon.png` (180×180, what iOS uses on the home screen) and `favicon.svg` (browser tab). `index.html` links them and sets `viewport-fit=cover` so the app can use the whole iPhone screen; the `safe-area-bottom` utility in `index.css` keeps the bottom nav above the home indicator.

---

### `frontend/nginx.conf.template` and `frontend/Dockerfile`

In production (and with `docker compose`) the frontend is served by nginx, not Vite. The Dockerfile builds the React app with pnpm, then copies the result into an nginx image.

`nginx.conf.template` is a *template*: when the container starts, the nginx image replaces `${PORT}` and `${BACKEND_URL}` with environment variables. Locally they default to port 80 and `http://backend:5001` (the backend's name in docker compose). On Railway, `PORT` is set automatically and `BACKEND_URL` points at the backend's private address. Requests to `/api/` are forwarded to the backend; everything else gets `index.html` so React Router can handle the URL.

See [Deploy to Railway](deploy-railway.md) for the production setup.

---

## Packages (`packages/schemas/`)

### `packages/schemas/src/kategori.ts`

Zod schemas for kategorier. `KategoriSchema` is the shape of a kategori returned from the API. `KategoriRequestSchema` validates the navn field when creating or renaming a kategori (not empty, max 100 characters).

---

### `packages/schemas/src/auth.ts`

Zod schemas for authentication:
- `LoginSchema` — validates the login form (email format, password min length). Used by React Hook Form on the frontend.
- `AuthResponseSchema` — the shape of a successful login response from the backend.

---

### `packages/schemas/src/oppskrift.ts`

Zod schemas for oppskrifter and ingredienser. `OppskriftSchema` describes the create/edit request; `OppskriftListItemSchema` and `OppskriftDetailSchema` describe what the API returns.

---

### `packages/schemas/src/ukesmeny.ts`

Zod schemas for the ukesmeny: `MåltidstypeSchema`, `DayOfWeekSchema` (mirrors .NET's English day names), `AddMåltidRequestSchema`, and the response shapes `MåltidResponseSchema` and `UkesmenyResponseSchema`.

---

### `packages/schemas/src/index.ts`

Re-exports everything from all schema files. This is why the frontend can write `import { OppskriftSchema } from '@mealmate/schemas'` — one clean import, regardless of which file the schema lives in.
