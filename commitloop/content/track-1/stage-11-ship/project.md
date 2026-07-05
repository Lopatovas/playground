**Track 1 finale** — tests, CI, deploy, smoke test. Graduate with a live app and green checks.

## Phase 1 — Tests locally (do this first)

```bash
git switch -c feature/ship
```

### Set up if missing

In `api/`:

- Vitest + supertest
- Separate test database (`DATABASE_URL=file:./test.db`)
- `npm test` script

### Watch one fail, then fix

1. Run `npm test`
2. Intentionally break a validation rule — see red
3. Fix — see green

This habit is the point of lesson 1.

### Required integration tests

| Test | Expect |
| --- | --- |
| GET /me, no token | 401 |
| GET /admin/… as `user` | 403 |
| GET /your-resource?page=1&limit=5 vs page=2 | Different items when total > 5 |
| GET with relation (e.g. workout + category join) | 200 + expected shape |
| POST invalid body | 400 |

Add unit tests for validation (3–5 cases).

Commit: `test: auth, pagination, and relation integration tests`.

## Phase 2 — CI

Add or extend `.github/workflows/ci.yml`:

```yaml
- run: npm ci
- run: npm test
```

Push branch — confirm GitHub shows green before merge.

Commit: `ci: run tests on push`.

## Phase 3 — Deploy

Only after **local tests pass**.

### API

- Host (Railway, Render, Fly.io): root `api/`
- Env: `DATABASE_URL`, `JWT_SECRET`, `WEB_URL` (production frontend URL)
- Persistent DB (not ephemeral SQLite disk)
- `GET /health` for smoke test

### Web

- Host (Vercel, Netlify): root `web/`
- Env: `API_URL` or equivalent pointing to production API
- Update API CORS / `WEB_URL` to allow production origin

Commit: `chore: production deploy config`.

## Phase 4 — Smoke test live

On **production URLs** (not localhost):

1. Register / login
2. Create a record
3. Search for it
4. Refresh — data persists
5. Network tab → requests hit production API

## Phase 5 — README and merge

```markdown
## Live demo
- Web: https://…
- API: https://…

## Stack
Express, SQLite/Postgres, vanilla JS, Vitest, GitHub Actions
```

Open PR. Merge when CI green.

## Graduation checklist

- [ ] Live HTTPS URLs in README
- [ ] Tests in CI (401, 403, pagination, relation)
- [ ] Auth + search work on production
- [ ] Git history shows feature branches and meaningful commits

You built, tested, deployed, and evolved a full-stack application in one repository. Track 2 is optional depth — you already graduated Track 1.
