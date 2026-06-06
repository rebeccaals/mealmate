---
sidebar_position: 1
---

# ADR-001: Technology Stack

**Date:** 2026-06-06  
**Status:** Accepted

## Decision

| Layer | Choice |
|---|---|
| Frontend | Vite + React + TypeScript |
| Styling | Tailwind CSS v4 + shadcn/ui |
| State | Redux Toolkit + RTK Query |
| Forms | React Hook Form + Zod |
| Backend | ASP.NET Core Web API (.NET 9) |
| Database | PostgreSQL |
| ORM | Entity Framework Core |
| Auth | ASP.NET Core Identity + JWT |
| Package manager | pnpm workspaces |
| Hosting | Railway |
| Containers | Docker + Docker Compose |

## Reasoning

**React over Swift/native iOS:** Both users access the app via Safari on iPhone. A well-built responsive React PWA provides a native-app feel (installable to home screen) without requiring Swift knowledge. Allows the primary developer to focus learning on backend and infrastructure rather than a third language.

**ASP.NET Core over Node.js:** The developer works in a .NET environment professionally and wanted to deepen that expertise in a low-stakes setting.

**PostgreSQL over SQLite:** SQLite is file-based and harder to share in a hosted cloud environment. PostgreSQL is the standard choice for cloud-deployed relational databases and integrates cleanly with Railway and EF Core.

**Tailwind CSS v4 + shadcn/ui:** Tailwind's utility-class approach is the current industry standard. shadcn/ui provides accessible, well-designed components that live in the project (not a dependency), making them fully customizable.

**Redux Toolkit + RTK Query:** A deliberate learning goal. RTK Query handles all data fetching, caching, and invalidation cleanly. Redux Toolkit eliminates the boilerplate of traditional Redux.

**pnpm workspaces:** Chosen over npm/yarn for first-class monorepo support and efficient disk usage. Enables the shared `@mealmate/schemas` package.

**Railway over Azure/Fly.io:** Most beginner-friendly deployment platform. Offers auto-deploy from GitHub, free tier, and easy PostgreSQL hosting. Can migrate to Azure or Fly.io later without code changes (Docker containers are portable).

## Alternatives considered

- **Next.js (SSR):** Ruled out for initial version. No SEO benefit for an authenticated app. Added complexity without practical gain. Marked as future improvement.
- **Auth0 / OAuth:** Deferred. Only two users, no public registration. ASP.NET Core Identity provides more learning value.
- **Real-time sync (WebSockets):** Deferred. RTK Query's refetch-on-focus is sufficient for the shopping list use case for now.
