# E07-S01 — Local runtime

**Epic:** E07 The Foundry  
**MVP:** Yes  
**Status:** Draft

## Outcome

A reviewer can install or run Scryglass on their machine, point it at a checkout, and get the High Seat without a shared hosted service.

## Scope

### In

- Process model: CLI + local web UI is the default proposal
- Config: repo path, session dir, log level
- Health: can see git, can write sessions
- No cloud account required

### Out

- Hosted multi-user Scryglass
- CI-as-the-only-way-to-run (CI export can come later)
- Auto-update platform work

## Acceptance criteria

- [ ] `scryglass --help` (or equivalent) exists
- [ ] `scryglass open` starts or talks to the UI
- [ ] Sessions write to a documented directory
- [ ] The tool works offline except for optional Jev
- [ ] README for Scryglass-the-product (when code exists) matches this story

## Tasks

- [ ] Decide runtime: Node CLI + Vite UI, or similar
- [ ] Repo-local config file shape
- [ ] Logging and crash files next to sessions
- [ ] `.scryglass` gitignore recommendation
- [ ] Smoke test: open fixture repo

## Depends on

- None (this is the floor)

## Open questions

- Package as a workspace in this playground repo, or a new package name `scryglass`
- Do we need Docker for Playwright browsers in MVP?
