# Deploy CommitLoop (free tier)

**Stack:** Vercel (web) + Neon (Postgres) + Render (API)

**Production domains:**

| Host | Service |
|------|---------|
| [commitloop.dev](https://commitloop.dev) | Vercel (web) |
| [api.commitloop.dev](https://api.commitloop.dev) | Render (API) |

Web and API share the same registrable domain so session cookies work across origins.

---

## 1. Neon — database

1. Create a project at [neon.tech](https://neon.tech) (free tier).
2. Copy the **pooled** connection string (port **6543**, “Transaction” mode) — better for Render’s Node process.
3. Append `?sslmode=require` if not already present.
4. Save as `DATABASE_URL` — paste into Render (step 2).

Local dev instead of Neon:

```bash
cd commitloop
docker compose up -d postgres
cp .env.example .env
npm run db:migrate -w @commitloop/api   # first time only
```

---

## 2. Render — API (`api.commitloop.dev`)

1. [render.com](https://render.com) → **New** → **Blueprint** (or Web Service).
2. Connect this GitHub repo.
3. Blueprint path: `commitloop/render.yaml`
4. Set **environment variables** in the Render dashboard:

| Variable | Value |
|----------|--------|
| `DATABASE_URL` | Neon pooled URL |
| `SESSION_SECRET` | `openssl rand -hex 32` |
| `WEB_URL` | `https://commitloop.dev` |
| `GITHUB_CLIENT_ID` | from GitHub OAuth app |
| `GITHUB_CLIENT_SECRET` | from GitHub OAuth app |
| `GITHUB_CALLBACK_URL` | `https://api.commitloop.dev/auth/github/callback` |
| `MENTOR_GITHUB_IDS` | your GitHub numeric user id |

5. Deploy, then add custom domain **`api.commitloop.dev`** in Render → Settings → Custom Domains (DNS: CNAME to Render).

`preDeployCommand` runs `prisma migrate deploy` before each deploy.

**Free tier:** service sleeps after ~15 min idle; first request may take 30–60s.

Health check: `GET /health`

---

## 3. GitHub OAuth app

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

## 4. Vercel — web (`commitloop.dev`)

1. [vercel.com](https://vercel.com) → Import repo.
2. **Root Directory:** `commitloop/web`
3. Framework: Next.js (auto-detected; `vercel.json` sets install from monorepo root).
4. **Environment variable:**

| Variable | Value |
|----------|--------|
| `NEXT_PUBLIC_API_URL` | `https://api.commitloop.dev` |

5. Deploy, then add custom domain **`commitloop.dev`** in Vercel → Settings → Domains.

---

## 5. DNS

| Record | Name | Target |
|--------|------|--------|
| CNAME or A | `@` / `commitloop.dev` | Vercel (follow Vercel DNS instructions) |
| CNAME | `api` | Render hostname for `commitloop-api` |

After DNS propagates, confirm both services show the custom domain as active.

---

## 6. Verify

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
cd commitloop
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
| `CommitLoop CI` | PR + push to any branch | Tests, lint, build |
| `CommitLoop Deploy` | Push to `main` (+ manual) | CI gate → deploy API + web |

**Pipeline:** merge to `main` → CI passes → Render API deploy (with `prisma migrate deploy`) → Vercel web deploy → health check on `https://api.commitloop.dev/health`.

### One-time setup

1. **Render** — create the service from `render.yaml`, add custom domain `api.commitloop.dev`.  
   Settings → **Deploy Hook** → copy URL.  
   Turn off **Auto-Deploy** if you only want GitHub Actions to deploy.

2. **Vercel** — import repo, root `commitloop/web`, domain `commitloop.dev`, env `NEXT_PUBLIC_API_URL=https://api.commitloop.dev`.  
   Settings → disable **Auto-Deploy** on git push if using Actions only.  
   Note **Org ID** and **Project ID** from project settings.

3. **GitHub** — repo → Settings → Environments → create `production`, then add secrets:

| Secret | Source |
|--------|--------|
| `RENDER_DEPLOY_HOOK` | Render → service → Deploy Hook |
| `VERCEL_TOKEN` | [vercel.com/account/tokens](https://vercel.com/account/tokens) |
| `VERCEL_ORG_ID` | Vercel project settings |
| `VERCEL_PROJECT_ID` | Vercel project settings |

4. **Neon** — `DATABASE_URL` stays on Render only (migrations run in Render `preDeployCommand`).

Manual deploy: Actions → **CommitLoop Deploy** → **Run workflow**.
