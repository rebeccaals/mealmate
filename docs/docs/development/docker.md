---
sidebar_position: 2
---

# Docker & Docker Compose

## What is a container?

Imagine sending a recipe to a friend. You could just send the recipe card — but then they need to already have the right oven, pans, and ingredients. If they don't, it won't work.

A **container** is like sending the entire kitchen along with the recipe. It bundles your app *and* everything it needs to run (the right version of .NET, Node.js, all dependencies, OS libraries) into one self-contained unit. No matter whose computer it runs on — your Mac, a friend's machine, or a server in a data centre — it behaves identically.

**Docker** is the tool that builds and runs containers. **Docker Compose** is the tool that coordinates *multiple* containers together.

## Mealmate's containers

Mealmate runs as three containers wired together:

```
mealmate-postgres-1   PostgreSQL database, isolated from your Mac
mealmate-backend-1    .NET API, talks to the database over Docker's internal network
mealmate-frontend-1   nginx serving the built React app
```

They are isolated from your Mac but can talk to each other through Docker's internal network. Ports like `3000` and `5001` are "holes" poked through that network to let your browser in.

```
Your browser
     │
     ├── :3000 ──► mealmate-frontend-1 (nginx → React)
     │
     └── :5001 ──► mealmate-backend-1 (.NET API)
                         │
                         └── internal ──► mealmate-postgres-1 (PostgreSQL)
```

Your browser never talks to the database directly — only the backend does.

## Commands you'll use

| Command | What it does |
|---|---|
| `docker compose up` | Start all containers |
| `docker compose up --build` | Rebuild images, then start |
| `docker compose down` | Stop and remove containers (data is safe) |
| `docker compose down -v` | Stop and delete everything including the database |
| `docker compose logs -f backend` | Stream live backend logs |
| `docker compose logs -f frontend` | Stream live frontend logs |
| `docker ps` | See all running containers and their ports |

## Should you `docker compose down` when you're done?

**Yes.** Running containers consume memory and CPU even when you're not using the app. `docker compose down` stops them cleanly. Your data is safe — PostgreSQL stores it in a Docker *volume* (persistent storage that lives outside the container and survives restarts).

Only `docker compose down -v` deletes the volume and wipes the database. Use this when you want a completely clean slate (e.g. after a breaking migration change).

## Understanding `--build` and Docker's layer cache

When Docker builds your app, it doesn't start from scratch every time. It saves each step as a **layer** — a snapshot it can reuse. Think of it like baking: if you've already made the dough, you don't need to make it again just to add toppings.

For example, your backend Dockerfile has these steps:
1. Download the .NET SDK base image
2. Copy the `.csproj` file and run `dotnet restore` (download NuGet packages)
3. Copy your source code
4. Run `dotnet publish` (compile the app)

Docker caches each of these steps. If only your source code changed, Docker skips straight to step 3 — it doesn't re-download the SDK or re-run `dotnet restore`. This makes rebuilds much faster.

**The catch:** when you run `docker compose up` without `--build`, Docker doesn't rebuild at all — it just starts the containers from the last time you built them. So if you've changed code since then, the running app is still the old version. You won't see your changes.

`--build` tells Docker Compose to rebuild the images before starting:

```bash
docker compose up --build
```

Use `--build` after:
- Changing any backend C# code
- Changing any frontend React/TypeScript code
- Adding or removing npm or NuGet packages
- Changing a Dockerfile itself

If you're unsure whether to use it: use it. The worst case is it takes an extra 20 seconds.

## Daily development workflow (recommended)

Running `docker compose up --build` after every code change is slow. The recommended workflow during active development is to run only the database in Docker, and run the backend and frontend directly on your Mac:

**Terminal 1 — database:**
```bash
docker compose up postgres
```
This starts just PostgreSQL. You don't need PostgreSQL installed on your Mac — Docker handles it.

**Terminal 2 — backend:**
```bash
cd backend
dotnet run
```
The backend restarts in a few seconds when you make changes.

**Terminal 3 — frontend:**
```bash
cd frontend
pnpm dev
```
Vite's **hot reload** means the browser updates instantly every time you save a file — no restart needed at all.

This setup gives you a fast, smooth development experience. Save a React component → see the change in the browser immediately. Fix a bug in the backend → restart with `dotnet run` in a few seconds.

**Use `docker compose up --build`** when you want to test the full production-like setup (all three containers together), or just before pushing a change to Railway to make sure everything works end-to-end.

## Why Docker for deployment?

Railway (your hosting provider) runs your app as Docker containers. Because your local Docker image and the Railway container use the exact same Dockerfile, what works locally is guaranteed to work in production. No more "it works on my machine" problems.
