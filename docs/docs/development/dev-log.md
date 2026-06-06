---
sidebar_position: 3
---

# Development Log

A running log of what was built, in what order, and why. Useful for jumping back in after a break.

---

## Step 1 — Project scaffold (2026-06-06)

**What we did:** Created the full project structure from scratch.

- Initialized a pnpm monorepo with three workspaces: `frontend`, `packages/schemas`, and `docs`
- Scaffolded the React + TypeScript frontend with Vite
- Scaffolded the ASP.NET Core Web API backend
- Set up Docker and Docker Compose to run everything locally with one command
- Set up GitHub Actions for CI (runs on every push to main)
- Wrote the initial Docusaurus documentation site with ADRs

**Key concepts introduced:**
- Monorepo, Docker, Docker Compose, GitHub Actions, pnpm workspaces

---

## Step 2 — Database migrations (2026-06-06)

### What is a migration?

When you define your data models in C# (like `Recipe`, `AppUser`, `ShoppingList`), Entity Framework Core needs to translate those into actual database tables. A **migration** is the bridge between your C# code and your database.

Running `dotnet ef migrations add InitialCreate` made EF Core look at all your model classes and generate a file (in `backend/Migrations/`) that describes exactly what SQL to run to create all the tables. Running `dotnet ef database update` then executed that SQL against the PostgreSQL database.

Think of it like this: your C# models are the *design*, and the migration is the *construction plan* that turns the design into a real database.

**Why migrations instead of just writing SQL manually?**
- Migrations are version-controlled — you can see the full history of how your schema evolved
- EF Core can generate them automatically from your C# models
- You can roll back a migration if something goes wrong
- They run automatically in CI and on Railway, so the database is always in sync with the code

**What was created:** Every model class became a table — `AspNetUsers`, `Recipes`, `Ingredients`, `Categories`, `WeeklyMenus`, `MenuEntries`, `ShoppingLists`, `ShoppingItems`, and all the Identity tables for authentication.

---

## Step 3 — Database seeding (2026-06-06)

### What is seeding?

**Seeding** means pre-filling the database with data that needs to exist before the app can be used.

In mealmate's case, there is no registration page — only two people will ever use this app (Rebecca and Nicolay), and their accounts are created automatically when the backend starts up for the first time. That's seeding.

The seeder (`backend/Data/DataSeeder.cs`) runs every time the backend starts. It checks whether each user already exists — if not, it creates them. If they already exist, it does nothing. This makes it safe to run repeatedly without creating duplicates.

**Why seed instead of registering through the app?**
- We deliberately chose not to build a registration page, since the app is for exactly two known users
- Seeding keeps the setup simple — start the app, and the accounts are already there
- The accounts can still have their passwords changed later through a "change password" feature

**What was created:**
| Email | Display name | Temporary password |
|---|---|---|
| rebecca_div@outlook.com | Rebecca | Mealmate1 |
| nicolovli@gmail.com | Nicolay | Mealmate1 |

---

## What's next

- [ ] Login endpoint (backend) — an API endpoint that takes email + password and returns a JWT token
- [ ] Login page (frontend) — a form that calls the login endpoint and stores the token
- [ ] Categories — CRUD for recipe categories
- [ ] Recipes — CRUD for recipes with ingredients and steps
- [ ] Weekly menu — planning meals for each day of the week
- [ ] Shopping list — auto-generated from the menu, with smart unit combining
- [ ] Deploy to Railway
