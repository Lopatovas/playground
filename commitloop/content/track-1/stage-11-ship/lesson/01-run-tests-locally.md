## Tests before deploy — always

Stage 11 starts with **`npm test` on your machine**, not with Railway or Vercel. Deploying a broken app teaches the wrong lesson.

## First run

```bash
cd api
npm test
```

You should see something like:

```text
✓ validateWorkout rejects empty name
✓ GET /workouts returns 200
✗ GET /me returns 401 without token — expected 401, got 200
```

One failing test is **useful** — it shows exactly what to fix.

## Watch mode while fixing

```bash
npm run test:watch
```

Edit code, save, tests re-run. Faster loop than push-and-wait-for-CI.

## Deliberately break, then fix

Learning exercise (5 minutes):

1. Comment out `requireAuth` on one route
2. Run tests → auth test fails
3. Restore middleware → green

You now trust that test to catch real regressions.

## Test database

Never point tests at production:

```text
# .env.test
DATABASE_URL=file:./test.db
JWT_SECRET=test-secret
```

Reset or recreate `test.db` between test files so order doesn't matter.

## Green local → push → CI → deploy

```text
npm test (local green)
  → git push
  → GitHub Actions npm test (CI green)
  → deploy API + web
  → smoke test live URLs
```

Skip local tests and you debug failures in production — slow and embarrassing.

## CommitLoop reference

See `commitloop/api/vitest.config.ts` and existing test files for patterns: `createApp()` with injected dependencies, supertest agents, isolated DB.

Your project should mirror that structure.
