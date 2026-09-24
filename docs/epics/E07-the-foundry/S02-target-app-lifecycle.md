# E07-S02 — Target app lifecycle

**Epic:** E07 The Foundry  
**MVP:** Yes  
**Status:** Draft

## Outcome

Scryglass can start the target application on the PR checkout, wait until it is ready, tell Playwright the URL, and tear it down. Later, it can do the same for base.

## Scope

### In

- Configured boot command and ready URL (or a convention)
- Port allocation
- Ready probe
- Shutdown / orphan cleanup
- Optional second worktree for base (used by E03-S03)

### Out

- Detecting any monorepo on earth without config
- Production deploys
- Remote preview environments as a requirement (optional later)

## Acceptance criteria

- [ ] A configured boot command yields a URL Playwright can open
- [ ] Ready probe fails with a readable error after timeout
- [ ] Stopping the session stops the app
- [ ] Two boots (base + PR) can be described even if MVP only runs one at a time
- [ ] Logs from the target app are stored on the session

## Tasks

- [ ] `devCommand`, `readyUrl`, `readyTimeout` config
- [ ] Process supervisor
- [ ] Worktree helper for base
- [ ] Cleanup on crash
- [ ] Test with a tiny static server fixture

## Depends on

- E07-S01
- Knowledge of the first target repo's boot

## Open questions

- `npm run dev` vs `vite preview` vs existing docker-compose
- Do we reuse the reviewer's already-running app, or always boot our own?
