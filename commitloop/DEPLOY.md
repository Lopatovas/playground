# Deploy CommitLoop (free tier)

**Stack:** Vercel (web) + Render (API + Postgres)

**Production domains:**

| Host | Service |
|------|---------|
| [commitloop.dev](https://commitloop.dev) | Vercel (web) |
| [api.commitloop.dev](https://api.commitloop.dev) | Render (API) |

Web and API share the same registrable domain so session cookies work across origins.

---

## 1. Render — Blueprint (API + Postgres)

One `render.yaml` creates both the database and API in **Frankfurt** (same region = private network).

1. [render.com](https://render.com) → **New** → **Blueprint**
2. Connect repo `Lopatovas/commitloop`
3. Blueprint path: `render.yaml`
4. When prompted, set secrets Render can't generate:

| Variable | Value |
|----------|--------|
| `GITHUB_CLIENT_ID` | GitHub OAuth app |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth app |
| `MENTOR_GITHUB_IDS` | Your GitHub numeric user id |

`DATABASE_URL` is wired automatically from the `commitloopdb` Postgres instance.

**Already created `commitloopdb` manually?** Sync the Blueprint — Render adopts the existing database if the name matches.

Resources defined in `render.yaml`:

| Resource | Name |
|----------|------|
| Postgres (free) | `commitloopdb` |
| Web service (free) | `commitloop-api` |

5. After deploy → **commitloop-api** → **Settings → Custom Domains** → add `api.commitloop.dev`
6. **Settings → Deploy Hook** → copy URL for GitHub Actions

Migrations run on **start** (`npm run start:prod` → `prisma migrate deploy` then the server). Render free tier has no pre-deploy hook.

**Free tier:** API sleeps after ~15 min idle; first request may take 30–60s.

Health check: `GET /health`

### Local dev (Postgres without Render)

```bash
docker compose up -d postgres
cp .env.example .env
npm run db:migrate -w @commitloop/api   # first time only
```

---

## 2. GitHub OAuth app

[github.com/settings/developers](https://github.com/settings/developers) → OAuth App:

| Field | Value |
|-------|--------|
| Homepage URL | `https://commitloop.dev` |
| Callback URL | `https://api.commitloop.dev/auth/github/callback` |

For local dev, add a second OAuth app (or use the same with localhost callback in `.env`):

| Field | Local value |
|-------|-------------|
| Callback URL | `http://localhost:3001/auth/github/callback` |

Use the same `CLIENT_ID` / `SECRET` on Render for production.

---

## 3. Vercel — web (`commitloop.dev`)

1. [vercel.com](https://vercel.com) → Import repo `Lopatovas/commitloop`.
2. **Root Directory:** `web`
3. Framework: Next.js (auto-detected; `vercel.json` installs from monorepo root).
4. **Environment variable:**

| Variable | Value |
|----------|--------|
| `NEXT_PUBLIC_API_URL` | `https://api.commitloop.dev` |

5. Deploy, then add custom domain **`commitloop.dev`** in Vercel → Settings → Domains.

---

## 4. DNS

| Record | Name | Target |
|--------|------|--------|
| CNAME or A | `@` / `commitloop.dev` | Vercel (follow Vercel DNS instructions) |
| CNAME | `api` | Render hostname for `commitloop-api` |

After DNS propagates, confirm both services show the custom domain as active.

---

## 5. Verify

```bash
curl https://api.commitloop.dev/health
# {"ok":true,"service":"commitloop-api"}

open https://commitloop.dev/curriculum
# 12 stages listed

# Sign in with GitHub on https://commitloop.dev/home
```

---

## Local commands

```bash
docker compose up -d postgres
cp .env.example .env          # fill GitHub OAuth for local login
npm install
npm run db:generate -w @commitloop/api
npm run db:migrate -w @commitloop/api
npm run dev -w @commitloop/api    # :3001
npm run dev -w @commitloop/web    # :3000  (Node >= 20.9)
```

Run tests (Postgres must be up):

```bash
npm test
```

---

## GitHub Actions (CI + deploy)

| Workflow | Trigger | What it does |
|----------|---------|--------------|
| `CI` | PR + push to any branch | Tests, lint, build |
| `Deploy` | Push to `main` (+ manual) | CI gate → deploy API + web |

**Pipeline:** merge to `main` → CI passes → Render API deploy (with `prisma migrate deploy`) → Vercel web deploy → health check on `https://api.commitloop.dev/health`.

### One-time setup

1. **Render** — create the service from `render.yaml`, add custom domain `api.commitloop.dev`.  
   Settings → **Deploy Hook** → copy URL.  
   Turn off **Auto-Deploy** if you only want GitHub Actions to deploy.

2. **Vercel** — import repo, root `web`, domain `commitloop.dev`, env `NEXT_PUBLIC_API_URL=https://api.commitloop.dev`.  
   Settings → disable **Auto-Deploy** on git push if using Actions only.  
   Note **Org ID** and **Project ID** from project settings.

3. **GitHub** (`Lopatovas/commitloop`) — Settings → Environments → create `production`, then add secrets:

| Secret | Source |
|--------|--------|
| `RENDER_DEPLOY_HOOK` | Render → service → Deploy Hook |
| `VERCEL_TOKEN` | [vercel.com/account/tokens](https://vercel.com/account/tokens) |
| `VERCEL_ORG_ID` | Vercel project settings |
| `VERCEL_PROJECT_ID` | Vercel project settings |

4. **Neon (optional)** — only if you prefer an external DB; otherwise Render Postgres from `render.yaml` is enough.

Manual deploy: Actions → **Deploy** → **Run workflow**.
