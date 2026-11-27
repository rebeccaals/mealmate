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

The backend is the .NET API. On Railway it becomes its own *service* (a box on the project canvas) that is built from the `backend/` folder of the GitHub repo.

> Railway's UI changes now and then — if a button has a slightly different name, look for the closest match.

#### 2a. Create the service from GitHub

1. In your project, click **+ Create** (top right of the canvas) → **GitHub Repo**.
2. The first time, Railway asks for access to GitHub: click **Configure GitHub App**, choose your account, and give it access to the `mealmate` repo (or all repos). Then go back to Railway.
3. Pick **`rebeccaals/mealmate`** from the list.
4. A new box appears on the canvas and Railway immediately starts building. **This first build will fail** — it doesn't know yet that the backend lives in `backend/` or which secrets to use. That's expected; we fix it below.

#### 2b. Rename it to `backend`

1. Click the new box to open its side panel.
2. Click the service's name at the very top of the panel (probably `mealmate`) — it becomes editable.
3. Change it to exactly **`backend`** and press Enter.

The name matters: the frontend finds the backend by this name later (`${{backend.…}}`).

#### 2c. Point it at the `backend/` folder

1. Still in **Settings**, scroll to the **Source** section.
2. Find **Root Directory** (it may be a link that says **Add Root Directory**).
3. Type **`/backend`** and save (Enter or the ✓).

Railway now looks inside `backend/` and finds `backend/Dockerfile` by itself, which tells it how to build the API.

#### 2d. Make a JWT secret and choose passwords

Do this on your Mac before filling in the variables.

1. Open a terminal and run:
   ```
   openssl rand -base64 48
   ```
   It prints a long random string like `k3J9…Qz8=`. Copy it — this is the **JWT key**, the secret the backend uses to sign login tokens. Don't reuse it anywhere else and don't commit it.
2. Choose a password for each of you (**at least 8 characters**). These replace `Mealmate1` in production.

#### 2e. Add the variables

1. Open the **Variables** tab of the `backend` service.
2. Click **Raw Editor** (lets you paste everything at once instead of one variable at a time).
3. Paste this, and replace the three `<…>` placeholders with your JWT key and passwords. Leave the `${{ … }}` parts exactly as they are:
   ```
   ConnectionStrings__DefaultConnection=Host=${{Postgres.PGHOST}};Port=${{Postgres.PGPORT}};Database=${{Postgres.PGDATABASE}};Username=${{Postgres.PGUSER}};Password=${{Postgres.PGPASSWORD}}
   Jwt__Key=<the string from openssl>
   SeedPasswords__Rebecca=<Rebecca's password>
   SeedPasswords__Nicolay=<Nicolay's password>
   ```
4. Click **Update Variables** (or **Save**).

What these are:

| Variable | What it does |
|---|---|
| `ConnectionStrings__DefaultConnection` | Tells the backend how to reach the database. `${{Postgres.PGHOST}}` etc. are *references*: Railway fills in the real host, user and password from the `Postgres` service, so you never copy them by hand. (Only works if the database service is named `Postgres`.) |
| `Jwt__Key` | The secret for signing login tokens. |
| `SeedPasswords__Rebecca` / `__Nicolay` | Your passwords. Only used the very first time each user is created — changing them later does nothing, because the user already exists. |

The double underscore `__` means "nested setting": `Jwt__Key` is the same as `Jwt:Key` in `appsettings.json`.

#### 2f. Deploy

1. Railway collects your changes and shows a bar at the top of the canvas, something like **Apply 5 changes** / **Deploy**. Click it.
2. A new build starts. Follow it in the **Deployments** tab → click the newest deployment → **View logs**. The first build takes a few minutes.
3. It worked when the logs show the tables being created (`CREATE TABLE "Oppskrifter"` …) and a line like:
   ```
   Now listening on: http://[::]:5001
   ```
   and the deployment status is **Active / Success**.

#### 2g. Don't make it public

Leave **Settings → Networking → Public Networking** alone — **don't** click *Generate Domain* for the backend. Only the frontend should be reachable from the internet; it talks to the backend over Railway's private network.

### 3. Frontend service

1. **+ Create → GitHub Repo →** `rebeccaals/mealmate` again. Rename the service to **`frontend`**.
2. Leave **Root Directory** empty (the frontend build needs the whole repo because of the `@mealmate/schemas` package).
3. **Variables:**

   | Variable | Value |
   |---|---|
   | `RAILWAY_DOCKERFILE_PATH` | `frontend/Dockerfile` |
   | `BACKEND_URL` | `http://${{backend.RAILWAY_PRIVATE_DOMAIN}}:5001` |

4. **Settings → Networking → Generate Domain.** This is the app's URL.

### 4. Recommended: only rebuild what changed

By default every push to `main` rebuilds and restarts **both** services — even a commit that only touches `docs/`. *Watch Paths* tell Railway which files matter for each service, so unrelated commits are skipped.

For each service: **Settings → Source → Watch Paths**, add one pattern per line:

- **backend:**
  ```
  /backend/**
  ```
- **frontend** (also needs the root workspace files, because its Dockerfile copies them):
  ```
  /frontend/**
  /packages/**
  /package.json
  /pnpm-lock.yaml
  /pnpm-workspace.yaml
  ```

If you ever change a Dockerfile to copy something from a new place, add that path here too — otherwise a change there won't trigger a deploy.

## Install on iPhone

1. Open the frontend URL in **Safari**.
2. Tap **Del** (share) → **Legg til på Hjem-skjerm**.
3. The app opens full screen with the Mealmate icon.

## Troubleshooting

- **Backend crashes with `Jwt:Key is required`** or **`SeedPasswords:… is required`** → a variable is missing on the backend service.
- **Login returns 502 / "Bad Gateway"** → nginx can't reach the backend. Check that the backend service is named `backend`, is running, and that `BACKEND_URL` is set on the frontend.
- **Logs:** click a service → **Deployments** → the latest deployment → **View logs**.
