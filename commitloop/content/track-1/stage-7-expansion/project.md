Expand your app with **authentication**, **user-scoped data**, a **related entity**, and **pagination**. Ship in incremental PRs.

## Phase 1 — Authentication

```bash
git switch -c feature/auth
```

- Add `users` table (id, email/username, password hash)
- `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, `GET /me`
- Hash passwords (bcrypt or similar)
- Session cookie or JWT — pick one, document it
- Frontend: login/register forms, guard protected pages

Tests: 401 on protected route without auth.

Commit and merge via PR: `feat: user authentication`.

## Phase 2 — User-scoped data

```bash
git switch main && git pull
git switch -c feature/user-scoped-workouts
```

- Add `user_id` to your main table (migration, not DB wipe)
- All list/create operations filter by `req.session.userId` (or token subject)
- Verify user A cannot fetch user B's records

Tests: scoped list returns only own rows.

Merge PR: `feat: scope records to authenticated user`.

## Phase 3 — Related entity

```bash
git switch -c feature/categories
```

- Add a related table (e.g. `categories`) with FK to user
- Link main records to categories (optional FK on workout/recipe row)
- API: CRUD or at least list + assign for categories

Merge PR: `feat: add categories with foreign keys`.

## Phase 4 — Pagination

```bash
git switch -c feature/pagination
```

- `GET /your-resource?page=1&limit=20` returns `{ items, page, limit, total }`
- SQL `LIMIT` / `OFFSET` (or cursor if ambitious)
- Frontend: next/prev or page numbers

Tests: page 2 differs from page 1 when total > limit.

Merge PR: `feat: paginate resource list`.

## Phase 5 — Production check

- `npm test` green
- Deploy still works
- README updated with auth + live URL

## Outcome — Track 1 complete

You built, deployed, tested, and **expanded** a full-stack application in one repository.

Graduation checklist:

- [ ] Live HTTPS URL in README
- [ ] Git history shows daily commits and feature branches
- [ ] Tests run in CI
- [ ] Auth + scoped data + pagination working

What's next is your call: job search, Track 2 (frontend depth), or keep expanding this app.
