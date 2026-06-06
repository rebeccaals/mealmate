---
sidebar_position: 1
---

# Architecture Overview

## System diagram

```
iPhone / Mac browser
        │
        ▼
  React PWA (Vite)
  [Tailwind + shadcn/ui]
  [Redux Toolkit + RTK Query]
        │
        │ HTTP/JSON (JWT)
        │
        ▼
  ASP.NET Core Web API
  [FluentValidation]
  [ASP.NET Core Identity]
        │
        ▼
   PostgreSQL
```

## Request flow

1. User opens the app in Safari (or from home screen as PWA)
2. React app checks Redux store for a JWT token
3. RTK Query attaches the token to every API request via `prepareHeaders`
4. ASP.NET Core validates the JWT and processes the request
5. EF Core queries PostgreSQL and returns data
6. RTK Query caches the response and React renders it

## Key design principles

- **Shared data:** All content is shared between both users. No per-user isolation.
- **Attribution:** Actions (adding shopping items, checking them off) are recorded with the acting user's ID.
- **Mobile-first:** UI is designed for phone screens first, then scales up to desktop.
- **PWA:** The app can be installed to the iPhone home screen for a native-like experience.
