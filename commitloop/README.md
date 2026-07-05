# CommitLoop

**One loop. One project. Every day.**

Accountability-first engineering apprenticeship. GitHub is the source of truth.

- [Architecture](./docs/ARCHITECTURE.md)
- [Wireframes](./docs/WIREFRAMES.md)
- [Curriculum](./docs/curriculum.md)
- [Roadmap](./docs/ROADMAP.md)
- [Mentor view](./docs/MENTOR_VIEW.md)

## Stack

| Layer | Tech |
|-------|------|
| Web | Next.js 16 (App Router) → [commitloop.dev](https://commitloop.dev) on Vercel |
| API | Express + Prisma + PostgreSQL → [api.commitloop.dev](https://api.commitloop.dev) on Render |
| Content | Hybrid JSON + Markdown in `content/track-1/` |
| Quality | Vitest, ESLint 9 flat config, GitHub Actions CI |

Requires **Node >= 20.9** (Next.js 16).

## Quick start

```bash
cp .env.example .env
# GitHub OAuth app → callback http://localhost:3001/auth/github/callback

docker compose up -d postgres   # local Postgres (or use Neon URL in .env)
npm install                     # from commitloop/ (workspace root)
npm run db:generate -w @commitloop/api
npm run db:migrate -w @commitloop/api

npm run dev -w @commitloop/api    # :3001
npm run dev -w @commitloop/web    # :3000
```

**Production:** [commitloop.dev](https://commitloop.dev) · API [api.commitloop.dev](https://api.commitloop.dev) · [DEPLOY.md](./DEPLOY.md)

## App routes

| Route | Auth | Purpose |
|-------|------|---------|
| `/` | Public | Landing |
| `/curriculum` | Public | Track 1 stage map |
| `/home` | Required | Assignment + streak (primary dashboard) |
| `/assignment` | Required | Lesson / Sandbox / Quiz / Project + checklist |
| `/settings` | Required | GitHub repo link |
| `/mentor` | Mentor only | Student roster + GitHub activity |

Protected routes live under `app/(app)/` with a shared auth layout.

## API highlights

- `GET /assignment/current` — today's focus
- `POST /assignment/step` — switch lesson / sandbox / quiz / project
- `POST /assignment/quiz` — submit comprehension quiz (unlocks project on pass)
- `POST /assignment/checklist` — toggle checklist items
- `POST /assignment/advance` — next stage when checklist complete
- `GET /streak` — GitHub commit accountability (all branches, deduped by SHA)
- `GET /mentor/students` — mentor roster + activity (allowlisted GitHub ids)
- `GET /tracks/track-1/stages` — stage map with progress

## Project layout

```
commitloop/
  architecture/         # Deterministic structure + import boundary tests
  api/src/features/     # Domain routes + services
  api/src/clients/      # GitHub client (mockable)
  web/app/(app)/        # Protected pages
  web/features/         # Domain UI components
  web/lib/auth.tsx      # AuthProvider + useAuth
  content/track-1/      # Curriculum content (track manifest + stage folders)
```

## Authoring curriculum content

Track 1 uses a **hybrid** model:

```
content/track-1/
  track.json                      # stage list + availability
  stage-1-git-fundamentals/
    stage.json                    # goal, checklist, quiz
    lesson.md                     # theory
    sandbox.md                    # isolated practice
    project.md                    # apply in student repo
  _template/                      # copy to start a new stage
```

**Learning loop per stage:** Lesson → Sandbox → Quiz → Project → Checklist → advance.

1. Copy `content/track-1/_template/` to `stage-N-your-slug/`
2. Edit `stage.json` — goal, checklist ids, quiz questions (`passScore` default 0.8)
3. Write `lesson.md`, `sandbox.md`, `project.md` (plain markdown, no required headings)
4. Add the stage to `track.json` with `"available": false` until ready
5. Validate:

```bash
npm run content:check
```

Quiz answers are graded **server-side**. Never put `correctChoiceId` in client responses before submission.

## Quality

From `commitloop/`:

```bash
npm run arch:check      # architecture boundary tests (run before adding features)
npm run content:check   # validate track.json + stage.json + markdown files
npm run ci              # arch:check + content:check + typecheck + lint + coverage + build
npm run test            # unit + integration tests
npm run lint            # ESLint (api + web)
npm run format          # Prettier check
```

| Package | Tests | Lint |
|---------|-------|------|
| `api/` | Vitest + Supertest | ESLint 9 + typescript-eslint |
| `web/` | Vitest + Testing Library | ESLint 9 flat config (`eslint .`) |

CI runs on pushes to `commitloop/**` via GitHub Actions.
