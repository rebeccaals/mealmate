# mealmate

A shared recipe book, weekly meal planner, and shopping list app for two.

## Stack

| Layer | Technology |
|---|---|
| Frontend | Vite + React + TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| State | Redux Toolkit + RTK Query |
| Validation | Zod + React Hook Form |
| Backend | ASP.NET Core Web API (.NET 9) |
| Database | PostgreSQL |
| ORM | Entity Framework Core |
| Auth | ASP.NET Core Identity + JWT |
| Hosting | Railway |

## Getting started

**Prerequisites:** Node.js 22+, pnpm 10+, .NET 9 SDK, Docker Desktop

```bash
# Install JS dependencies
pnpm install

# Start everything (database + backend + frontend)
docker compose up
```

The frontend runs at `http://localhost:3000` and the backend at `http://localhost:5000`.  
API docs (Swagger) are available at `http://localhost:5000/swagger`.

## Project structure

```
mealmate/
  packages/schemas/   shared Zod schemas (local npm package)
  frontend/           Vite + React app
  backend/            ASP.NET Core Web API
  docs/               Docusaurus documentation site
  docker-compose.yml
```

## Documentation

System documentation is published to GitHub Pages via Docusaurus. Run `pnpm docs:dev` to preview locally.

User documentation lives in the [GitHub Wiki](../../wiki).
