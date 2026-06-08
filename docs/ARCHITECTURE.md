# CommitLoop — Architecture (locked)

Decisions from product validation. **Do not add features until wireframes are agreed.**

Last updated: 2026-06-08

---

## Summary

| Decision | Choice |
|----------|--------|
| Web frontend | **Next.js** (App Router) — easy hosting |
| API | **Separate Express layer** — kept for future mobile client |
| Database | SQLite (local dev) → **Postgres** (production) |
| Launch curriculum | **Track 1 only** |
| Post-login home | **Assignment first, streak second** (option C) |
| Existing code | **Evolve in place** — refactor `web/` to Next.js, keep `api/` |
| Visual | **Not vibecoded** — see [WIREFRAMES.md](./WIREFRAMES.md) |

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

**Why not Next.js API routes only:** Mobile needs the same backend. One Express service = one contract.

---

## API contract (direction)

REST JSON. Version prefix when mobile ships: `/v1/...`

| Endpoint | Purpose |
|----------|---------|
| `GET /health` | Liveness |
| `GET /auth/github` | Start OAuth |
| `GET /auth/github/callback` | OAuth callback |
| `GET /me` | Current user + track + stage |
| `POST /repo` | Link project repository |
| `GET /streak` | Accountability stats |
| `GET /curriculum/:trackId` | Stage list + content |
| `GET /assignment/current` | **New** — today's focus (stage + step) |
| `POST /assignment/progress` | **New** — mark lesson/sandbox/project step |

**Future (mobile):** `POST /auth/token` or session exchange; same endpoints with `Authorization: Bearer`.

---

## Web (Next.js) — planned structure

Evolve `commitloop/web/` in place:

```
commitloop/web/
  app/
    (marketing)/page.tsx          Landing
    (app)/home/page.tsx           Student home (assignment + streak)
    (app)/assignment/[stage]/page.tsx
    (app)/curriculum/page.tsx
    (app)/settings/page.tsx
  components/
    assignment-card.tsx
    streak-panel.tsx
    wireframe-*.tsx               (delete after design lock)
  lib/api.ts                      fetch wrapper → Express API
```

- **Marketing** and **app** route groups — different layouts
- No API routes in Next.js for domain logic (delegates to Express)
- Auth: cookie session from API (same origin in prod via subdomain or proxy)

---

## Visual principles (anti-slop)

- **Light mode default** — warm off-white background, not OLED black
- **One accent** — muted green for streak/active states only
- **Typography** — one sans (body), monospace for repo/stats only
- **No** gradients, glass blur, hero illustrations, AI stock art, emoji UI
- **Density** — information-first; feels like a tool (Linear, old GitHub issues), not a landing-page template
- **Wireframes first** — [WIREFRAMES.md](./WIREFRAMES.md) + interactive canvas before pixel polish

---

## What's built today (spike)

`commitloop/api` — OAuth, streak, curriculum serve ✅  
`commitloop/web` — Vite + React (to be migrated to Next.js) ⚠️  
Dashboard is **streak-first** — wrong per decision C; fix during wireframe implementation.

---

## Implementation order (after wireframes approved)

1. Lock wireframes (you + agent)
2. Migrate `web/` → Next.js with agreed layouts
3. Add `GET /assignment/current` + home screen (assignment + streak)
4. Track 1 Stages 0–2 content
5. Deploy API + web
6. Mentor inactive view

**Not now:** Track 2, payments, mobile app, AI features.
