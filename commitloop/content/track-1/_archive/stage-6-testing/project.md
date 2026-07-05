Add automated tests to your project. Focus on the API — that's the contract your UI depends on.

## 1. Branch and tooling

```bash
git switch -c feature/testing
```

In `api/`:

- Ensure Vitest is configured (see CommitLoop's `api/vitest.config.ts` as reference)
- Add supertest for HTTP tests
- Point tests at a **separate** test database

Commit: `chore: set up vitest and test database`.

## 2. Unit tests for validation / service

Test the validation logic in your API from Stages 3–4:

- Valid input → no errors (or success return)
- Empty required field → error
- Invalid type or negative number → error

Aim for **3–5** focused unit tests.

Commit: `test: unit tests for workout validation`.

## 3. Integration tests for endpoints

Using supertest + `createApp` pattern (or your equivalent):

- `GET /your-resource` → 200 + array
- `POST /your-resource` with valid body → 201
- `POST` with invalid body → 400

Commit: `test: integration tests for main resource endpoints`.

## 4. Wire CI

Add or extend `.github/workflows/ci.yml` in your repo:

- `npm ci`
- `npm test` (api package at minimum)

Push and confirm GitHub shows a green check.

Commit: `ci: run tests on push`.

## 5. Merge

```bash
npm test   # local green
git push -u origin feature/testing
```

Open PR, merge when CI passes.

## Outcome

Refactors and deploys have a safety net. You're practicing the same testing habits as the CommitLoop codebase itself. Next: expand the product with auth and related data.
