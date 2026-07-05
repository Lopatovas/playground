## CI runs what you run locally

**Continuous Integration** — GitHub Actions runs `npm test` on every push:

```yaml
# .github/workflows/ci.yml (simplified)
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
      - run: npm ci
      - run: npm test
```

Red check on a PR = don't merge until fixed.

## Ideal flow

```text
local npm test green
  → push feature branch
  → CI green
  → merge to main
  → auto-deploy (optional)
  → smoke test production
```

Some teams deploy only from `main` after CI. That's the habit Track 1 builds.

## Red builds are success

A failing CI run **before** merge caught a bug early. Fix on the branch, push, watch green.

Never merge with red CI "to fix later."

## Smoke test after deploy

Automated tests don't replace a quick **live** check:

1. `curl https://YOUR-API/health` → `{ "ok": true }`
2. Open production web URL
3. Register or login
4. Create a record through the UI
5. Search for it
6. DevTools Network → requests go to **production API**, not localhost

```javascript
app.get("/health", (_req, res) => {
  res.json({ ok: true });
});
```

## Graduation artifact

You should have:

- Public repo with meaningful commit history
- Live HTTPS URLs in README
- Tests in CI covering auth (401/403), pagination, relations
- One architecture note or diagram in README (optional but strong)

> Track 1 success = a link you can put on a resume **and** tests that prove it works.

What's next: job search, keep expanding this app, or Track 2 specialization (React depth, backend ops, mobile).
