# E01-S05 — Fetch and checkout

**Epic:** E01 The Opening  
**MVP:** Yes  
**Status:** Draft

## Outcome

Scryglass obtains a git workdir for the PR without the reviewer cloning first. Later stories read this workdir. The reviewer never has to think about where the code lives unless something fails.

## Scope

### In

- Clone or fetch via the host adapter (SSH or HTTPS with stored credentials)
- Workdir per session, reusable on resume
- Checkout head; remember base SHA for diffs and Mirror
- `git fetch` on a later sitting so new commits appear
- Cleanup policy (keep until the PR is closed or the user deletes the session)

### Out

- The reviewer maintaining their own clone
- Patching the author's remote
- Multi-repo monorepo detection beyond "the repo the PR is on"

## Acceptance criteria

- [ ] After `open <url>`, a workdir exists and `headSha` is checked out
- [ ] Re-opening the same PR fetches and updates the workdir instead of cloning from scratch
- [ ] Fetch failure is readable and does not corrupt the previous workdir
- [ ] Session records `workdir` path
- [ ] Two PRs from the same repo do not share a dirty worktree

## Tasks

- [ ] Workdir layout, e.g. `~/.scryglass/workdirs/<host>/<repo>/<prId>/`
- [ ] Clone / fetch / checkout via git
- [ ] Credential hook from the Bitbucket adapter
- [ ] Update-on-resume
- [ ] Tests with a fixture remote (or local bare repo)

## Depends on

- E01-S01
- E07 host adapter

## Open questions

- Shallow clone vs full history (Mirror/base compare may want merge-base)
- Submodules
- Disk budget for a chapter lead who opens many client PRs
