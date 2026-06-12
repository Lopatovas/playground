## Tests only help if they run automatically

Local `npm test` is step one. **CI** (Continuous Integration) runs the same command on every push to GitHub.

```yaml
# .github/workflows/ci.yml (simplified)
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

If tests fail, the check goes red. PRs shouldn't merge until green.

## CommitLoop's CI

Your monorepo already runs `npm run ci` in GitHub Actions: architecture checks, content validation, typecheck, lint, tests, build. You're aligning your project with professional practice.

## Red builds are good

A failing CI run on your branch **before** merge is success — you caught the bug early. Fix it on the branch, push, watch green.

## Deploy + tests

Ideal flow:

```text
push → CI tests pass → deploy
```

Some teams deploy only from `main` after CI. That's the habit Track 1 is building toward.
