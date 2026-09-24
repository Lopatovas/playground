# E07-S04 — Preview data and fixtures

**Epic:** E07 The Foundry  
**MVP:** After MVP unless the first repo cannot show a useful UI without it  
**Status:** Draft

## Outcome

Rendered states are honest. If the app needs a user, a fixture, or a mock API to show populated/empty/error, Scryglass has a place to configure that. If it does not, we do not invent a harness.

## Scope

### In

- Config for auth bootstrap (cookie, token, storage)
- Hooks to start MSW / mock servers the repo already has
- Seed data or "review user" convention
- Recording that a still was captured under fixture X

### Out

- Building a universal mock platform
- Hitting production
- Faking populated UI with screenshots we did not take

## Acceptance criteria

- [ ] A route that needs auth can be marked `needsAuth` and skipped or bootstrapped
- [ ] When a fixture is used, the capture metadata names it
- [ ] No fixture configured → we only capture what the default app shows
- [ ] Secrets stay local and are not written into receipts

## Tasks

- [ ] Survey the first target repo's existing test/mock setup
- [ ] Config fields for auth + mocks
- [ ] Redact secrets from session logs
- [ ] Document "public routes only" as a valid MVP

## Depends on

- E07-S02
- E03-S04 if we want state matrices

## Open questions

- Does the first repo already have Playwright auth storage state we can reuse?
- Are we allowed to run against a shared staging API from a reviewer's machine?
