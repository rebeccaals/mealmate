---
sidebar_position: 2
---

# ADR-002: Monorepo Structure

**Date:** 2026-06-06  
**Status:** Accepted

## Decision

All code lives in a single GitHub repository (`mealmate`) structured as a pnpm workspace monorepo:

```
mealmate/
  packages/schemas/   shared Zod schemas
  frontend/           Vite + React
  backend/            ASP.NET Core
  docs/               Docusaurus
  docker-compose.yml
```

## Reasoning

With only two applications (frontend + backend) and two users, the overhead of separate repositories (separate CI pipelines, cross-repo dependency management, coordinating releases) outweighs any benefit.

A monorepo allows:
- One `git push` covers both frontend and backend
- `docker compose up` starts everything locally with one command
- The shared `@mealmate/schemas` package can be referenced as a local workspace dependency without publishing to npm

## Alternatives considered

- **Separate repos:** Standard for larger teams. Not worth the overhead at this scale.
