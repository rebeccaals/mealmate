---
sidebar_position: 3
---

# ADR-003: Authentication

**Date:** 2026-06-06  
**Status:** Accepted

## Decision

Authentication uses **ASP.NET Core Identity** for user management with **JWT Bearer tokens** for API authorization.

Users are seeded directly into the database on first run. There is no public registration UI.

## Reasoning

With exactly two known users (household partners), no registration flow is needed. Seeding accounts directly keeps the surface area small and avoids building user management features that will never be used.

ASP.NET Core Identity provides battle-tested password hashing, account management, and EF Core integration. JWT tokens are stateless and work cleanly with RTK Query's `prepareHeaders` for attaching the auth header to every API request.

## Alternatives considered

- **Auth0 / Clerk:** Would reduce auth code to nearly zero, but adds an external dependency and removes the learning opportunity.
- **Sign in with Google (OAuth):** Simple UX, no password management. Rejected because it adds an external dependency and the developer wanted to understand how auth works under the hood.
- **Simple custom JWT (no Identity):** Less boilerplate, but Identity's password hashing and account primitives are valuable even for two users.
