---
sidebar_position: 6
---

# Deploy to Railway

How Mealmate runs in production, and how to set it up from scratch.

## What runs where

```
iPhone (Safari / home screen)
   │  https://<frontend>.up.railway.app
   ▼
frontend service ── nginx: serves the React build, forwards /api/* ──┐
                                                                    │ private network
backend service  ── ASP.NET Core on port 5001 ◄─────────────────────┘
   │
   ▼
Postgres (Railway database)
```

- Only the **frontend** has a public URL. The backend is reached through Railway's private network, so the browser always talks to one origin and CORS is not needed.
- The backend **applies migrations on startup** and creates both users if they don't exist — no manual database steps.
- Every push to `main` redeploys automatically.

## One-time setup

### 1. Project and database

1. Log in at [railway.com](https://railway.com) with GitHub.
2. **New Project → Empty Project.**
3. **+ Create → Database → PostgreSQL.** Leave the service name as `Postgres`.

### 2. Backend service

1. **+ Create → GitHub Repo →** `rebeccaals/mealmate`. Rename the service to **`backend`** (the frontend refers to it by this name).
2. **Settings → Source → Root Directory:** `/backend` — Railway then finds `backend/Dockerfile`.
3. **Variables** — add these (the `${{ }}` parts are Railway references, paste them as-is):

   | Variable | Value |
   |---|---|
   | `ConnectionStrings__DefaultConnection` | `Host=${{Postgres.PGHOST}};Port=${{Postgres.PGPORT}};Database=${{Postgres.PGDATABASE}};Username=${{Postgres.PGUSER}};Password=${{Postgres.PGPASSWORD}}` |
   | `Jwt__Key` | a long random secret — generate one with `openssl rand -base64 48` |
   | `SeedPasswords__Rebecca` | Rebecca's password (min. 8 characters) |
   | `SeedPasswords__Nicolay` | Nicolay's password (min. 8 characters) |

4. Do **not** generate a public domain for the backend.

The seed passwords are only used the first time each user is created. Changing them afterwards does nothing — the user already exists.

### 3. Frontend service

1. **+ Create → GitHub Repo →** `rebeccaals/mealmate` again. Rename the service to **`frontend`**.
2. Leave **Root Directory** empty (the frontend build needs the whole repo because of the `@mealmate/schemas` package).
3. **Variables:**

   | Variable | Value |
   |---|---|
   | `RAILWAY_DOCKERFILE_PATH` | `frontend/Dockerfile` |
   | `BACKEND_URL` | `http://${{backend.RAILWAY_PRIVATE_DOMAIN}}:5001` |

4. **Settings → Networking → Generate Domain.** This is the app's URL.

### 4. Optional: only rebuild what changed

Under **Settings → Source → Watch Paths**:
- backend: `/backend/**`
- frontend: `/frontend/**` and `/packages/**`

## Install on iPhone

1. Open the frontend URL in **Safari**.
2. Tap **Del** (share) → **Legg til på Hjem-skjerm**.
3. The app opens full screen with the Mealmate icon.

## Troubleshooting

- **Backend crashes with `Jwt:Key is required`** or **`SeedPasswords:… is required`** → a variable is missing on the backend service.
- **Login returns 502 / "Bad Gateway"** → nginx can't reach the backend. Check that the backend service is named `backend`, is running, and that `BACKEND_URL` is set on the frontend.
- **Logs:** click a service → **Deployments** → the latest deployment → **View logs**.
