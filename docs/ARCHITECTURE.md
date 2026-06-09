# CommitLoop — Architecture

Decisions from product validation. Last updated: 2026-06-09.

---

## Summary

| Decision | Choice |
|----------|--------|
| Web frontend | **Next.js 16** (App Router) → Vercel |
| API | **Express** feature modules — stable JSON surface for future mobile |
| Database | SQLite (local dev) → **Postgres** (production) |
| Launch curriculum | **Track 1 only** |
| Post-login home | **Assignment first, streak second** (layout C) |
| Auth | Cookie session via API; `AuthProvider` + `(app)` route group |
| Visual | **Light, tool-like** — see [WIREFRAMES.md](./WIREFRAMES.md) |

---

## System shape

```
┌─────────────────┐     ┌─────────────────┐     ┌──────────┐
│  Next.js (web)  │────▶│  Express (api)  │────▶│ Postgres │
│  Vercel         │     │  Railway/Fly    │     │ Neon     │
└─────────────────┘     └────────┬────────┘     └──────────┘
                                 │
                    ┌────────────┼────────────┐
                    ▼            ▼            ▼
              GitHub API    Markdown content   (future)
              OAuth       (track-1/*.md)      Mobile app
```

**Why split:** Web ships fast on Vercel. API stays a stable JSON surface for a future React Native / Expo app without coupling to Next.js server routes.

---

## API structure

`commitloop/api/src/` is organized by feature domain:

```
api/src/
  app.ts                    # compose Express app
  index.ts                  # bootstrap + listen
  config/env.ts             # env → AppConfig
  clients/github.client.ts  # GitHub OAuth + API (injectable in tests)
  middleware/
    auth.ts                 # requireAuth
    session.ts              # express-session
    error.ts                # global error handler
  features/
    health/                 # GET /health
    auth/                   # GitHub OAuth, logout
    user/                   # GET /me
    assignment/             # current, step, checklist, advance
    repo/                   # POST /repo
    streak/                 # GET /streak
    curriculum/             # tracks, raw markdown
  test/                     # integration test helpers
```

Each feature owns its routes; services hold pure logic where possible. `createApp(prisma, config, { github? })` accepts dependency injection for tests.

---

## API contract

REST JSON. Version prefix when mobile ships: `/v1/...`

| Endpoint | Purpose |
|----------|---------|
| `GET /health` | Liveness |
| `GET /auth/github` | Start OAuth |
| `GET /auth/github/callback` | OAuth callback |
| `POST /auth/logout` | End session |
| `GET /me` | Current user + track + stage + step |
| `POST /repo` | Link project repository |
| `GET /streak` | Accountability stats |
| `GET /tracks/:trackId/stages` | Stage map with progress status |
| `GET /curriculum/:trackId` | Raw markdown stages |
| `GET /assignment/current` | Today's focus (stage + step + checklist) |
| `POST /assignment/step` | Switch lesson / sandbox / project tab |
| `POST /assignment/checklist` | Toggle checklist item |
| `POST /assignment/advance` | Move to next stage when checklist complete |

**Future (mobile):** `POST /auth/token` or session exchange; same endpoints with `Authorization: Bearer`.

---

## Web structure

```
commitloop/web/
  app/
    page.tsx                  # Landing (public)
    curriculum/page.tsx       # Track map (public; shows user header if logged in)
    (app)/                    # Protected route group
      layout.tsx              # Auth gate + AppHeader
      home/page.tsx           # Assignment + streak
      assignment/page.tsx     # Lesson / Sandbox / Project tabs
      settings/page.tsx       # Repo link
    providers.tsx             # AuthProvider wrapper
    layout.tsx                # Root layout + fonts
  components/                 # Shared UI (header, markdown, streak panel)
  features/                   # Domain components by area
    assignment/
    curriculum/
    dashboard/
    landing/
    repo/
    settings/
  lib/
    api.ts                    # fetch wrapper → Express API
    auth.tsx                  # AuthProvider + useAuth
```

- **No API routes in Next.js** for domain logic — all data via Express
- **Public pages:** `/`, `/curriculum`
- **Protected pages:** `/home`, `/assignment`, `/settings` (via `(app)/layout.tsx`)
- Auth: cookie session from API (`credentials: "include"`)

---

## Visual principles (anti-slop)

- **Light mode default** — warm off-white background
- **One accent** — muted green for streak/active states only
- **Typography** — Source Sans 3 (body), IBM Plex Mono (stats/repo)
- **No** gradients, glass blur, hero illustrations, emoji UI
- **Density** — information-first; feels like a tool, not a landing-page template

Wireframes: [WIREFRAMES.md](./WIREFRAMES.md) — **implemented in v0**.

---

## Quality

From `commitloop/`:

```bash
npm run ci    # typecheck + eslint + coverage + build
```

| Package | Tests | Lint |
|---------|-------|------|
| `api/` | Vitest + Supertest (41 tests) | ESLint 9 + typescript-eslint |
| `web/` | Vitest + Testing Library (26 tests) | ESLint 9 flat config (`eslint.config.mjs`) |

CI: `.github/workflows/commitloop-ci.yml` on pushes to `commitloop/**`.

**Note:** Next.js 16 requires Node `>=20.9`. Use Node 22 in CI and locally.

---

## What's built

| Area | Status |
|------|--------|
| GitHub OAuth + repo linking | ✅ |
| Assignment-first home + streak panel | ✅ |
| Assignment tabs + checklist + advance | ✅ |
| Track 1 curriculum (Stage 0–1) | ✅ |
| Feature-based API + web architecture | ✅ |
| Tests + coverage thresholds | ✅ |

---

## Next up

1. GitHub OAuth credentials (user blocker)
2. Stage 2–4 curriculum content
3. Deploy API + web to commitloop.dev
4. Mentor inactive view

**Not now:** Track 2, payments, mobile app, AI mentor.
