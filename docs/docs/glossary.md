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

### What is a migration (EF Core)?

A **migration** is a snapshot of a change to your database schema — adding a table, adding a column, changing a type, etc.

Entity Framework Core generates migrations from your C# model classes. When you add a new property to `Recipe`, you run `dotnet ef migrations add <name>` and EF Core writes a migration file describing exactly what SQL to run to update the database. You then run `dotnet ef database update` to apply it.

This means your database schema is version-controlled alongside your code — you can see the full history of how the schema evolved.

---

### What is RTK Query?

**RTK Query** is a data-fetching and caching tool built into Redux Toolkit. Instead of manually writing `fetch()` calls, loading states, error handling, and cache invalidation, RTK Query handles all of it.

You define *what* data you want (e.g. "get all recipes from `/api/recipes`") and RTK Query takes care of *how* — fetching, caching the result, re-fetching when the data is stale, and updating the UI automatically.

---

### What is a workspace package (pnpm)?

In a pnpm monorepo, a **workspace package** is a local npm package that other packages in the same repo can import directly — without publishing it to npm.

In mealmate, `packages/schemas` is a workspace package named `@mealmate/schemas`. The frontend imports from it with `import { RecipeSchema } from '@mealmate/schemas'`, and pnpm resolves that to the local folder automatically. This lets the frontend and backend share the same Zod schema definitions.

---

### What is Swagger / Swagger UI?

**Swagger UI** is an interactive documentation page for your API, auto-generated from your backend code. In mealmate it's available at `http://localhost:5001/swagger` when running locally.

On that page you can see every endpoint the backend exposes, what parameters they accept, what they return, and you can actually call them directly from the browser — useful for testing the API without needing a frontend yet.

---

### What is hot reload?

**Hot reload** means the browser (or app) updates instantly when you save a file — without needing to refresh the page or restart anything.

In mealmate, `pnpm dev` runs Vite's dev server which has hot reload built in. Change a React component, save the file, and the browser reflects the change within milliseconds. Your app state (what page you're on, what's typed in a form) is usually preserved too.

The backend (`dotnet run`) does *not* have hot reload by default — you need to restart it after changing C# code. You can use `dotnet watch run` to get automatic restarts on save.
