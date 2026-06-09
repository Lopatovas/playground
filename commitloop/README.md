# CommitLoop

**One loop. One project. Every day.**

Accountability-first engineering apprenticeship. GitHub is the source of truth.

- [Architecture](../docs/ARCHITECTURE.md)
- [Wireframes](../docs/WIREFRAMES.md)
- [Curriculum](../docs/curriculum.md)
- [Roadmap](../docs/ROADMAP.md)

## Stack

| Layer | Tech |
|-------|------|
| Web | Next.js 16 (App Router) → Vercel |
| API | Express (feature modules) + Prisma + SQLite (dev) → Postgres (prod) |
| Content | Markdown in `content/track-1/` |
| Quality | Vitest, ESLint 9 flat config, GitHub Actions CI |

Requires **Node >= 20.9** (Next.js 16).

## Quick start

```bash
cp .env.example .env
# GitHub OAuth app → callback http://localhost:3001/auth/github/callback

npm install          # from commitloop/ (workspace root)
npm run db:generate -w @commitloop/api
npm run db:migrate -w @commitloop/api

npm run dev -w @commitloop/api    # :3001
npm run dev -w @commitloop/web    # :3000
```

## App routes

| Route | Auth | Purpose |
|-------|------|---------|
| `/` | Public | Landing |
| `/curriculum` | Public | Track 1 stage map |
| `/home` | Required | Assignment + streak (primary dashboard) |
| `/assignment` | Required | Lesson / Sandbox / Project tabs + checklist |
| `/settings` | Required | GitHub repo link |

Protected routes live under `app/(app)/` with a shared auth layout.

## API highlights

- `GET /assignment/current` — today's focus
- `POST /assignment/step` — switch lesson / sandbox / project
- `POST /assignment/checklist` — toggle checklist items
- `POST /assignment/advance` — next stage when checklist complete
- `GET /streak` — GitHub commit accountability
- `GET /tracks/track-1/stages` — stage map with progress

## Project layout

```
commitloop/
  api/src/features/     # Domain routes + services
  api/src/clients/      # GitHub client (mockable)
  web/app/(app)/        # Protected pages
  web/features/         # Domain UI components
  web/lib/auth.tsx      # AuthProvider + useAuth
  content/track-1/      # Curriculum markdown
```

## Quality

From `commitloop/`:

```bash
npm run ci              # typecheck + lint + coverage + build
npm run test            # unit + integration tests
npm run lint            # ESLint (api + web)
npm run format          # Prettier check
```

| Package | Tests | Lint |
|---------|-------|------|
| `api/` | Vitest + Supertest | ESLint 9 + typescript-eslint |
| `web/` | Vitest + Testing Library | ESLint 9 flat config (`eslint .`) |

CI runs on pushes to `commitloop/**` via GitHub Actions.
