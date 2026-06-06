---
sidebar_position: 1
---

# Getting Started

## Prerequisites

| Tool | Version | Install |
|---|---|---|
| Node.js | 22+ | [nodejs.org](https://nodejs.org) |
| pnpm | 10+ | `npm install -g pnpm` |
| .NET SDK | 9+ | [dotnet.microsoft.com](https://dotnet.microsoft.com/download) |
| Docker Desktop | latest | [docker.com](https://www.docker.com/products/docker-desktop) |

## Running locally

### Option 1: Docker Compose (recommended)

Starts the database, backend, and frontend together:

```bash
docker compose up
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- Swagger UI: http://localhost:5000/swagger

### Option 2: Run services individually

**Database only (via Docker):**
```bash
docker compose up postgres
```

**Backend:**
```bash
cd backend
dotnet run
```

**Frontend:**
```bash
pnpm install
pnpm dev
```

## Database migrations

After changing a model, create and apply a migration:

```bash
cd backend
dotnet ef migrations add <MigrationName>
dotnet ef database update
```

## Environment variables

| Variable | Description | Default (dev) |
|---|---|---|
| `ConnectionStrings__DefaultConnection` | PostgreSQL connection string | see `appsettings.json` |
| `Jwt__Key` | JWT signing secret | dev placeholder (change in prod!) |
| `Jwt__Issuer` | JWT issuer | `mealmate` |
| `Jwt__Audience` | JWT audience | `mealmate` |
