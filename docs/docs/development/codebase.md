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
- `GET /api/ukesmeny?ukestart=YYYY-MM-DD` — returns the ukesmeny for a given week; `ukestart` must be a Monday or returns 400. Each måltid comes with its porsjoner, notat and oppskrifter (id + tittel). Returns an empty list if nothing is planned yet (no DB row created).
- `PUT /api/ukesmeny/{ukestart}/maltider/{dag}/{maltidstype}` — **upsert**: sets the whole måltid for one dag + måltidstype (`{ porsjoner, notat, oppskriftIder }`). Creates the `Ukesmeny` row lazily if needed. If the måltid ends up with no oppskrifter and no notat, it's deleted and the endpoint returns 204. Returns 400 if any oppskriftId doesn't exist.

There's no separate "add"/"remove" endpoint: the frontend always sends the complete måltid, which keeps the API to one endpoint and makes every save idempotent. Routes use ASCII (`maltider`, `maltidstype`) so URLs aren't percent-encoded (ADR-005).

---

### `Controllers/OppskrifterController.cs`

Full CRUD for oppskrifter, all endpoints requiring a valid JWT:
- `GET /api/oppskrifter` (`GetOppskrifter`) — list all oppskrifter (tittel, beskrivelse, kategorier, porsjoner/time info — no ingredienser)
- `GET /api/oppskrifter/{id}` (`GetOppskrift`) — full oppskrift including ingredienser and steg
- `POST /api/oppskrifter` (`CreateOppskrift`) — creates an oppskrift; records `OpprettetAvId` from the JWT. Each ingrediens' butikkvare is looked up by name (ignoring case) and created if it doesn't exist (`ToIngredienser`)
- `PUT /api/oppskrifter/{id}` (`UpdateOppskrift`) — full replace; old ingredienser are deleted and recreated from the request
- `DELETE /api/oppskrifter/{id}` (`DeleteOppskrift`) — deletes the oppskrift and cascades to its ingredienser. It's also removed from any måltider; måltider left with no oppskrifter and no notat are deleted

The data shapes (DTOs) live in `DTOs/OppskriftDtos.cs`.

---

### `Validators/LoginRequestValidator.cs`

Validates the login request — email must be a valid format, password must not be empty.

---

### `Validators/KategoriRequestValidator.cs`

Validates kategori create/update requests — `Navn` must not be empty and must be under 100 characters.

---

### `Validators/OppskriftRequestValidator.cs`

Validates oppskrift create/update requests — tittel not empty, porsjoner positive, at least one ingrediens (each with a butikkvare name; mengde > 0 if given; mengde and enhet either both set or both missing; merknad max 200), at least one steg.

FluentValidation validators registered in `Program.cs` via `AddValidatorsFromAssemblyContaining<Program>()` — they run automatically before the controller method is called, returning a 400 if validation fails.

---

### `Validators/SaveMåltidRequestValidator.cs`

Validates a måltid save — porsjoner between 1 and 50, notat at most 200 characters, `OppskriftIder` present (may be empty).

---

### `Validators/ButikkvareRequestValidators.cs`

Two small validators for the butikkvarer API: bulk create (at least one name, each max 100 characters, valid avdeling) and update (name not empty, valid avdeling).

---

### `DTOs/UkesmenyDtos.cs`

Data shapes for the ukesmeny API: `UkesmenyDto` (the full week with its måltider), `MåltidDto` (dag, måltidstype, porsjoner, notat and its oppskrifter), `MåltidOppskriftDto` (just id + tittel — enough for the grid), and `SaveMåltidRequest` (what the frontend sends to save a måltid).

---

### `DTOs/KategoriDtos.cs`

Data shapes for the kategorier API: `KategoriDto` (what the API returns) and `KategoriRequest` (what the API accepts). Kept separate from the controller so they can be shared — `KategoriDto` is used by both `KategorierController` and `OppskrifterController`.

---

### `DTOs/OppskriftDtos.cs`

Data shapes for the oppskrifter API: `OppskriftListDto`, `OppskriftDetailDto`, `IngrediensDto`, `OppskriftRequest`, and `IngrediensRequestItem`. The list and detail DTOs are different shapes — the list omits ingredienser to keep the response light.

`IngrediensRequestItem` names the butikkvare by **name** (`ButikkvareNavn`) rather than id, plus an `Avdeling` that's only used if that butikkvare has to be created. `IngrediensDto` returns the butikkvare's name and avdeling alongside mengde, enhet and merknad.

---

### `DTOs/ButikkvareDtos.cs`

Data shapes for the butikkvarer API: `ButikkvareDto` (incl. `AntallOppskrifter` — how many oppskrifter use it), `CreateButikkvarerRequest` (several names + one avdeling), `UpdateButikkvareRequest` and `SlåSammenRequest` (which butikkvare to merge into).

---

### `Controllers/KategorierController.cs`

Full CRUD for kategorier, all endpoints requiring a valid JWT:
- `GET /api/kategorier` — returns all kategorier sorted alphabetically
- `POST /api/kategorier` — creates a kategori; validates navn via FluentValidation
- `PUT /api/kategorier/{id}` — renames a kategori; returns 404 if not found
- `DELETE /api/kategorier/{id}` — deletes a kategori; returns 409 Conflict if any oppskrifter use it

---

### `Controllers/ButikkvarerController.cs`

The butikkvare register:
- `GET /api/butikkvarer` — all butikkvarer, alphabetically, with how many oppskrifter use each
- `POST /api/butikkvarer` — bulk create from a list of names; names that already exist (ignoring case) are skipped
- `PUT /api/butikkvarer/{id}` — rename and/or change avdeling; 409 if another butikkvare already has the name
- `DELETE /api/butikkvarer/{id}` — 409 if any oppskrift uses it
- `POST /api/butikkvarer/{id}/sla-sammen` — merge a duplicate into another: moves every ingrediens over, then deletes the duplicate

---

### `Services/ButikkvareNavn.cs`

The name rules for butikkvarer, shared by both controllers: `Pent` ("  smør  usaltet " → "Smør usaltet", how names are stored) and `Normalisert` (lowercase, what names are compared by). They mirror `normaliserNavn` / `storForbokstav` in `packages/schemas/src/ingrediens.ts`, so the frontend and backend agree on when two names are "the same".

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

One line in an oppskrift: a `Butikkvare` plus `Mengde`, `Enhet` and `Merknad` (e.g. "2 ss smør, myk"). `Mengde`/`Enhet` are both null for things like "salt og pepper". `Rekkefølge` keeps the order the lines were written in. Always belongs to exactly one oppskrift.

Also defines the `Enhet` enum (g, kg, ml, dl, l, ts, ss, stk, fedd, pakke, boks, klype). `[JsonStringEnumMemberName("ss")]` makes the API send lowercase ("ss") while C# uses `Ss`; the database stores the C# name.

---

### `Models/Butikkvare.cs`

Something you buy, without an amount: `Navn` (unique ignoring case) and `Avdeling` — where in the store it is. Shared by all oppskrifter, and later the handleliste. Also defines the `Avdeling` enum; stored as text in the database.

---

### `Models/Kategori.cs`

A label that can be applied to oppskrifter (e.g. "Vegetar", "Rask", "Pasta"). Has only a `Navn`. Oppskrifter and kategorier have a many-to-many relationship — one oppskrift can have many kategorier, and one kategori can belong to many oppskrifter.

---

### `Models/Ukesmeny.cs`

Contains two classes and an enum:

- **`Ukesmeny`** — a week's plan, identified by `Ukestart` (always a Monday). Has a list of `Måltider`.
- **`Måltid`** — one dag + måltidstype, e.g. "tirsdag middag". Has `Porsjoner` (default 2, `StandardPorsjoner`), an optional `Notat` ("Rester", "Spiser ute") and zero or more `Oppskrifter` (many-to-many — tirsdag middag can be kyllinggryte + ris + salat). All its oppskrifter are scaled to the måltid's porsjoner. `Dag` uses .NET's built-in `DayOfWeek`, which is why it's serialized as English day names ("Tuesday").
- **`Måltidstype`** — `Frokost`, `Lunsj`, `Middag`, `Kvelds`.

`AppDbContext` makes dag + måltidstype unique per ukesmeny and names the join table `MåltidOppskrift(MåltidId, OppskriftId)`.

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

Usually you never edit these by hand — but a generated migration can lose data when it restructures tables. `MaltidMedFlereOppskrifter` was edited on purpose: it copies each måltid's old single `OppskriftId` into the new `MåltidOppskrift` table *before* dropping the column, and gives existing måltider 2 porsjoner instead of 0. `Butikkvarer` was edited the same way: it creates one butikkvare per distinct ingredient name, links every ingrediens to it, translates free-text units ("gram", "båter") to the fixed enheter (unknown ones become stk with the original text as merknad), and adds a case-insensitive unique index with raw SQL. Always read the generated migration when EF warns "may result in the loss of data".

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
- A **header** at the top with the app name, a shop icon linking to Butikkvarer, and a logout button
- A **`<main>`** area in the middle where the current page renders (via `<Outlet />`)
- A **bottom navigation bar** with links to Oppskrifter, Ukesmeny, and Handleliste

The bottom nav is styled for mobile — this is what makes the app feel like an iPhone app.

---

### `features/ukesmeny/ukesmenyApi.ts`

RTK Query endpoints for the ukesmeny: `useGetUkesmenyQuery` (fetch a week's måltider) and `useSaveMåltidMutation` (save a whole måltid — porsjoner, notat and oppskrifter; returns `null` if the måltid became empty and was removed). Both use the `Ukesmeny` cache tag, so the grid refetches after every save.

---

### `pages/UkesmenyPage.tsx`

The weekly meal planner. Shows a 7-column (man–søn) × 4-row (Frokost/Lunsj/Middag/Kvelds) grid for the current week. Prev/next buttons navigate between weeks.

Each filled måltid shows (via the small `MåltidInnhold` component) its first oppskrift, "+N" if there are more, and the porsjoner if they differ from 2 — or the notat in italics if there are no oppskrifter. Tapping a måltid opens `MåltidPanel`.

The API sends days as English `DayOfWeek` names; `DAGNAVN` maps them to Norwegian for display. Week state is local (not in Redux) — navigating away and back resets to the current week.

---

### `components/ukesmeny/MåltidPanel.tsx`

The panel at the bottom of the ukesmeny for editing one måltid. There is no save button — every change is saved immediately:
- the chosen oppskrifter, each with ✕ to remove and a tap to open the oppskrift
- a − / + stepper for porsjoner
- a notat field, saved when you leave it or press Enter
- a search field to add oppskrifter (already chosen ones are hidden)
- "Tøm måltid" to clear everything

Every action sends the whole måltid to `PUT …/maltider/{dag}/{maltidstype}` (built by the `lagre` helper from the current state plus the change). The page gives it a `key` per måltid so its local state (search text, notat being typed) resets when you tap a different måltid.

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

Full oppskrift view: tittel, beskrivelse, porsjoner, times, kategorier, ingrediensliste (mengde with decimal comma via `formatMengde`, "stk" left out, merknad in grey), and numbered steg ("Fremgangsmåte"). Has Rediger (navigates to `/oppskrifter/:id/rediger`) and Slett (with confirmation dialog) buttons.

---

### `components/oppskrifter/OppskriftForm.tsx`

Used for both creating (`/oppskrifter/ny`) and editing (`/oppskrifter/:id/rediger`). Detects its mode from the URL — if there's an `:id` param, it fetches the oppskrift and pre-fills the form.

Key parts:
- Basic fields (tittel, beskrivelse, porsjoner, forberedelse/tilberedning in minutes)
- **Ingredienser** — one free-text line each (`{ tekst, avdeling }`), rendered by `IngrediensLinje`. Enter inserts a new line below; pasting several lines splits them into rows. When editing, existing ingredienser are turned back into text with `formatIngrediens`. On submit, `tilIngrediensRequest` parses each line and sends the butikkvare by name (the exact stored name if it matched, otherwise capitalised with the chosen avdeling). Blank lines are ignored; a line with only an amount gets an error.
- **Steg** — dynamic list with up/down reorder buttons and remove; stored internally as `{ value }` objects (React Hook Form requires objects for field arrays), transformed to plain strings on submit
- **Kategorier** — toggle buttons for existing kategorier; inline "Ny kategori" input that immediately calls `POST /api/kategorier` and adds the new ID to the selection

---

### `components/oppskrifter/IngrediensLinje.tsx`

One ingredient line in the form. You type "2 ss smør, myk" and right below it the app shows what it understood as small chips: **2** · **ss** · **Smør ✓** · *myk*. If the name doesn't match a butikkvare exactly, it shows "Ny vare: «…»" with an avdeling picker, and "Mente du:" buttons for close matches — tapping one swaps the name but keeps amount, enhet and merknad. Handles Enter (new line) and multi-line paste (handed back to the form to split into rows).

---

### `pages/ButikkvarerPage.tsx`

The butikkvare register, reached from the shop icon in the header. Butikkvarer are grouped by avdeling with a search field. On each row the avdeling can be changed directly (the common job after the migration put everything in "Annet"); the arrow opens rename, "Slå sammen med…" and delete (only when no oppskrift uses it). At the top, a textarea adds many butikkvarer at once — one per line, all in the chosen avdeling.

---

### `features/butikkvarer/butikkvarerApi.ts`

RTK Query endpoints for butikkvarer: `useGetButikkvarerQuery`, `useCreateButikkvarerMutation` (bulk), `useUpdateButikkvareMutation`, `useDeleteButikkvareMutation`, `useSlåSammenButikkvarerMutation`. Renames and merges also invalidate `Oppskrift`, since butikkvare names are shown inside oppskrifter; saving an oppskrift invalidates `Butikkvare`, since it may have created new ones.

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

In production (and with `docker compose`) the frontend is served by nginx, not Vite. The Dockerfile builds the React app with pnpm, then copies the result into an nginx image. pnpm is pinned to the same version used locally (`pnpm@10.29.3`) — an unpinned `npm install -g pnpm` once picked up a newer pnpm that refused to install because of an unapproved build script. Packages allowed to run install scripts (currently `esbuild`) are listed under `onlyBuiltDependencies` in `pnpm-workspace.yaml`.

`nginx.conf.template` is a *template*: when the container starts, the nginx image replaces `${PORT}` and `${BACKEND_URL}` with environment variables. Locally they default to port 80 and `http://backend:5001` (the backend's name in docker compose). On Railway, `PORT` is set automatically and `BACKEND_URL` points at the backend's private address. Requests to `/api/` are forwarded to the backend; everything else gets `index.html` so React Router can handle the URL.

The backend address is looked up again every 10 seconds (`resolver` + a variable in `proxy_pass`). Without that, nginx resolves `backend.railway.internal` once at startup; after a backend redeploy the backend has a new private IP and every `/api` request hangs ("Laster…" forever) until the frontend is restarted. `NGINX_ENTRYPOINT_LOCAL_RESOLVERS=1` in the Dockerfile makes the nginx image fill in the container's own DNS server, so the same config works in docker compose and on Railway.

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

Zod schemas for oppskrifter and ingredienser. `OppskriftSchema` describes the create/edit request, with `IngrediensRequestSchema` (butikkvare by name + optional avdeling, mengde, enhet, merknad); `OppskriftListItemSchema`, `OppskriftDetailSchema` and `IngrediensResponseSchema` describe what the API returns.

---

### `packages/schemas/src/ingrediens.ts`

The ingredient "brain", shared by every part of the frontend that deals with ingredienser:
- `ENHETER` / `AVDELINGER` (+ `AVDELINGSNAVN` for display) — the fixed lists
- `tolkIngredienslinje("2 ss smør, myk")` → `{ mengde: 2, enhet: 'ss', navn: 'smør', merknad: 'myk' }`. Understands decimal commas, fractions (1/2, ½, 1 1/2), ranges (2-3 → 3), numbers glued to units (200g), written-out units (spiseskje, gram, båter), "en/ei/et" as 1, and list bullets from pasted recipes
- `formatIngrediens` / `formatMengde` — back to text ("2 ss Smør, myk", "0,5")
- `finnButikkvare` / `foreslåButikkvarer` — exact match and "Mente du" suggestions
- `normaliserNavn` / `storForbokstav` — the same name rules as `Services/ButikkvareNavn.cs` in the backend

---

### `packages/schemas/src/ingrediens.test.ts`

Vitest tests for the parser — every format above, plus "formatting then parsing gives the same result". Run with `pnpm test` from the repo root; CI runs them on every push. This is where to add a case when the parser misreads something you typed.

---

### `packages/schemas/src/butikkvare.ts`

Zod schemas for butikkvarer: `ButikkvareSchema` (with `antallOppskrifter`), and the bulk-create and update requests.

---

### `packages/schemas/src/ukesmeny.ts`

Zod schemas for the ukesmeny: `MåltidstypeSchema` (incl. Kvelds), `DayOfWeekSchema` (mirrors .NET's English day names), `SaveMåltidRequestSchema`, the response shapes `MåltidResponseSchema` and `UkesmenyResponseSchema`, and the constant `STANDARD_PORSJONER` (2) shared by the grid and the panel.

---

### `packages/schemas/src/index.ts`

Re-exports everything from all schema files. This is why the frontend can write `import { OppskriftSchema } from '@mealmate/schemas'` — one clean import, regardless of which file the schema lives in.
