# E01-S01 — Open a review session

**Epic:** E01 The Opening  
**MVP:** Yes  
**Status:** Draft

## Outcome

A reviewer can start Scryglass with either a PR URL or a local `head` + `base` pair and get a session identity back: repo, base ref, head ref, and resolved SHAs.

## Scope

### In

- CLI and/or UI entry: `scryglass open <pr-url>` and `scryglass open --base main --head HEAD`
- Resolve refs to immutable SHAs
- Fail clearly if the repo, base, or head cannot be resolved
- Record who opened it and when (local user is enough)

### Out

- Fetching the PR conversation / ticket
- Cloning a remote repo from scratch (assume a local checkout, or make clone a later task)
- Any analysis beyond identity

## Acceptance criteria

- [ ] Opening with `--base` and `--head` produces a session with both SHAs
- [ ] Opening with a PR URL either resolves to those refs or explains that host support is not wired
- [ ] A missing / invalid ref fails with a readable error, not a stack trace
- [ ] Re-opening the same base+head pair can resume or explicitly create a new session

## Tasks

- [ ] Define the `ReviewSessionIdentity` shape (`id`, `repoPath`, `baseRef`, `headRef`, `baseSha`, `headSha`, `prUrl?`, `openedAt`)
- [ ] Implement local git ref resolution
- [ ] Add PR URL parser (host, project, id) without requiring API success in MVP
- [ ] Wire the `open` command / first-run UI
- [ ] Write tests for good refs, bad refs, and detached HEAD

## Depends on

- E07-S01 for how the tool is invoked

## Open questions

- Resume vs always-new session when the same PR is opened twice
- Do we `git fetch` automatically, or only use what is already local?
