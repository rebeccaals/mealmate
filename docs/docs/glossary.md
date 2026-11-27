---
sidebar_position: 99
---

# Glossary & Q&A

Questions that came up during development, with answers. Updated continuously.

---

### What is CRUD?

**CRUD** stands for **Create, Read, Update, Delete** — the four basic operations you can perform on data.

For recipes in mealmate:
- **Create** — add a new recipe
- **Read** — view a recipe or a list of recipes
- **Update** — edit an existing recipe
- **Delete** — remove a recipe

Almost every feature in any app is built from some combination of these four operations. When someone says "we need CRUD for recipes," they mean we need endpoints and UI for all four.

---

### What is a container / what does "containerized" mean?

See the full explanation in [Docker & Docker Compose](development/docker.md).

Short version: a container bundles your app *and* everything it needs to run into one self-contained unit, so it behaves identically on any machine.

---

### What is Docker Compose?

A tool that coordinates multiple containers together. Mealmate uses it to start the database, backend, and frontend with a single `docker compose up` command.

See [Docker & Docker Compose](development/docker.md) for the full breakdown.

---

### What does `--build` mean in `docker compose up --build`?

Docker saves each build step as a cached "layer." Without `--build`, running `docker compose up` starts containers from the last build — it won't pick up any code changes you've made since then. `--build` forces Docker to rebuild the images with your latest code before starting.

See [Docker & Docker Compose](development/docker.md) for a detailed explanation.

---

### What is an ADR?

**ADR** stands for **Architecture Decision Record**. It's a short document that captures a decision that was made, why it was made, and what alternatives were considered.

The mealmate ADRs live in [Decisions](decisions/adr-001-tech-stack.md). They're useful for jumping back into the project after time away — instead of wondering "why did we use Redux instead of Zustand?", the answer is written down.

---

### What is JWT?

**JWT** stands for **JSON Web Token**. It's a compact, self-contained token that proves who you are to the backend.

When you log in, the backend checks your email and password, then hands you a JWT — a long encrypted string. From that point on, every request your frontend makes includes that token in a header. The backend reads it, verifies it hasn't been tampered with, and knows who you are without needing to check the database every time.

In mealmate, the JWT is stored in `localStorage` and attached to API requests automatically by RTK Query's `prepareHeaders`.

---

### What is a controller (ASP.NET Core)?

A **controller** is a class that receives HTTP requests and decides what to do with them. Each public method on a controller is an **endpoint** — a URL the frontend can call.

In mealmate, `AuthController` handles requests to `/api/auth/*`. `RecipesController` will handle `/api/recipes/*`, and so on. The controller's job is narrow: validate the input, call whatever logic is needed, and return a response.

Controllers don't contain business logic themselves — they're the entry point that delegates to services, the database, etc.

---

### What is a migration (EF Core)?

A **migration** is a snapshot of a change to your database schema — adding a table, adding a column, changing a type, etc.

Entity Framework Core generates migrations from your C# model classes. When you add a new property to `Recipe`, you run `dotnet ef migrations add <name>` and EF Core writes a migration file describing exactly what SQL to run to update the database. You then run `dotnet ef database update` to apply it.

This means your database schema is version-controlled alongside your code — you can see the full history of how the schema evolved.

---

### What is RTK Query?

**RTK Query** is a data-fetching and caching tool built into Redux Toolkit. Instead of manually writing `fetch()` calls, loading states, error handling, and cache invalidation, RTK Query handles all of it.

You define *what* data you want (e.g. "get all recipes from `/api/recipes`") and RTK Query takes care of *how* — fetching, caching the result, re-fetching when the data is stale, and updating the UI automatically.

---

### Why does `@mealmate/schemas` exist as a separate package?

The main benefits in mealmate are:

- **Single source of truth for TypeScript types** — types like `LoginInput` and `Recipe` are inferred directly from the Zod schemas, so you never define the same shape twice
- **Reuse across frontend packages** — if a React Native app were added later, it could import the same schemas rather than duplicating them
- **Form validation in one place** — React Hook Form uses the Zod schema directly, so validation rules live in one file rather than scattered across components

The classic pitch for this pattern is "share validation between frontend and backend" — meaning the server validates the incoming request with the same rules the form used. That works in Node.js/TypeScript full-stack projects. It doesn't apply to mealmate, because the backend is C# and can't use Zod at all. The backend has its own separate FluentValidation validators, which could theoretically drift out of sync with the Zod schemas.

---

### What is a workspace package (pnpm)?

In a pnpm monorepo, a **workspace package** is a local npm package that other packages in the same repo can import directly — without publishing it to npm.

In mealmate, `packages/schemas` is a workspace package named `@mealmate/schemas`. The frontend imports from it with `import { RecipeSchema } from '@mealmate/schemas'`, and pnpm resolves that to the local folder automatically. This lets the frontend and backend share the same Zod schema definitions.

---

### What is Swagger / Swagger UI?

**Swagger UI** is an interactive documentation page for your API, auto-generated from your backend code. In mealmate it's available at `http://localhost:5001/swagger` when running locally.

On that page you can see every endpoint the backend exposes, what parameters they accept, what they return, and you can actually call them directly from the browser — useful for testing the API without needing a frontend yet.

---

### What is a refresh token?

When you log in, the backend issues two tokens instead of one:

- **Access token** (JWT) — short-lived (e.g. 15 minutes). Sent with every API request to prove who you are.
- **Refresh token** — long-lived (e.g. 30 days). Stored in a secure cookie. Used *only* to get a new access token when the old one expires.

The idea: the access token is what gets stolen if an attacker intercepts your traffic, so you make it expire quickly. The refresh token never travels on regular API requests, so it's much harder to steal.

When the access token expires, the frontend detects the 401, silently calls `/api/auth/refresh` with the cookie, gets a new access token, and retries the original request — invisible to you.

Mealmate currently uses a simpler approach: one long-lived token (7 days), no refresh. This is fine for a private two-person app. Refresh token support is planned as a learning exercise later — the hook for it already exists in RTK Query's `baseQuery`.

---

### What is a Redux slice / authSlice?

A **slice** is Redux's term for one isolated piece of global state, bundled together with the functions that can change it.

The `authSlice` owns the authentication state — specifically: the JWT token (used to prove who you are to the backend) and the current user object (`id`, `email`, `displayName`). When you log in successfully, you call `setCredentials`, which updates both. When you log out, you call `logout`, which wipes both and removes the token from `localStorage`.

Other slices will own other domains: recipes, the shopping list, etc. Slices never reach into each other's state directly.

---

### How do I debug a failing API call?

When something goes wrong between the frontend and backend, the UI error message is often vague (by design — you don't want to leak details). The real error is in the browser's **Network tab**:

1. Open browser DevTools (`F12` or `Cmd+Option+I`)
2. Click the **Network** tab
3. Try the action again
4. Find the failed request in the list and click it
5. Look at the **Status** code and **Response** body

Common status codes:
- **No request at all** — the frontend didn't even try (JavaScript error before the call)
- **ERR_CONNECTION_REFUSED** — nothing is running on that port (server not started, or wrong port)
- **401** — request reached the server but credentials were rejected
- **400** — request reached the server but the input was invalid
- **500** — request reached the server but the server crashed handling it
- **CORS error** — server received the request but refused it due to origin mismatch

---

### What is Vite?

**Vite** is the tool that powers the frontend during development and builds it for production. It does two distinct jobs:

**In development (`pnpm dev`):**
- Starts a local web server at `localhost:5173` that serves your React app
- Watches your files and updates the browser instantly when you save (hot reload)
- Acts as a **proxy** — when the frontend calls `/api/...`, Vite forwards those requests to the backend on your behalf. This is why the frontend can call `/api/auth/login` without knowing or caring that the backend lives at a different port.

**For production (`pnpm build`):**
- Bundles all your TypeScript, React components, CSS, and assets into plain HTML/JS/CSS files
- Optimises them (minifying, tree-shaking unused code, etc.)
- Outputs everything to a `dist/` folder, which is what nginx serves in the Docker container

The proxy is a development-only feature — in production, nginx takes over that job (which is why `frontend/nginx.conf.template` has a `/api/` proxy block).

The main alternative is **Webpack**, which does the same jobs but is older, slower, and much more complex to configure. **Create React App** (now deprecated) was a popular wrapper around Webpack that gave you a working setup without touching the config. Older .NET + React projects at companies are usually running Webpack — Microsoft's ASP.NET Core templates only switched to Vite in .NET 7 (2022).

**Does the .NET version determine which build tool you use?**

No — they are completely independent. The .NET version is the backend runtime. Vite (or Webpack) is a frontend tool. They don't know about each other.

A project started in 2016 with Webpack can upgrade to .NET 9 without touching the frontend at all. The two upgrade paths are separate decisions. Microsoft's ASP.NET Core *project templates* (the scaffolding you get when you run `dotnet new react`) switched to Vite in .NET 7 — but that only affects *new* projects created from those templates. Existing projects keep whatever build tool they already had, even if they upgrade .NET.

So it's completely normal to have a .NET 9 backend running alongside a Webpack-based frontend that hasn't changed since 2016.

---

### What is hot reload?

**Hot reload** means the browser (or app) updates instantly when you save a file — without needing to refresh the page or restart anything.

In mealmate, `pnpm dev` runs Vite's dev server which has hot reload built in. Change a React component, save the file, and the browser reflects the change within milliseconds. Your app state (what page you're on, what's typed in a form) is usually preserved too.

The backend (`dotnet run`) does *not* have hot reload by default — you need to restart it after changing C# code. You can use `dotnet watch run` to get automatic restarts on save.
