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
| Web | Next.js 15 (App Router) → Vercel |
| API | Express + Prisma + SQLite (dev) → Postgres (prod) |
| Content | Markdown in `content/track-1/` |

## Quick start

```bash
cp .env.example .env
# GitHub OAuth app → callback http://localhost:3001/auth/github/callback

cd api && npm install && npx prisma migrate deploy && npm run dev
cd web && npm install && npm run dev
```

- Web: http://localhost:3000
- API: http://localhost:3001

## App routes

| Route | Purpose |
|-------|---------|
| `/` | Landing |
| `/home` | Assignment + streak (primary dashboard) |
| `/assignment` | Lesson / Sandbox / Project tabs + checklist |
| `/curriculum` | Track 1 stage map |
| `/settings` | GitHub repo link |

## API highlights

- `GET /assignment/current` — today's focus
- `POST /assignment/checklist` — toggle checklist items
- `POST /assignment/advance` — next stage when checklist complete
- `GET /streak` — GitHub commit accountability

## Quality

From `commitloop/`:

```bash
npm run ci          # typecheck + lint + coverage + build
npm run test        # unit + integration tests
npm run lint        # ESLint (api + web)
npm run format      # Prettier check
```

| Package | Tests | Lint |
|---------|-------|------|
| `api/` | Vitest + Supertest (SQLite test DB) | ESLint 9 + typescript-eslint |
| `web/` | Vitest + Testing Library | `eslint-config-next` |

CI runs on pushes to `commitloop/**` via GitHub Actions.
