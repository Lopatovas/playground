# E08-S04 — Resume sitting with old comments

**Epic:** E08 The Palimpsest  
**MVP:** Yes  
**Status:** Draft

## Outcome

Re-opening a PR restores the seat: selection if we have one, drafts, published comments we sent, and comments already on the PR. Yesterday's writing is still visible under today's change.

## Scope

### In

- Resume session by `(host, prId)`
- Restore drafts
- Fetch host PR comments via the adapter
- Show our published comments and others' comments as context (read-only for others)
- If a line moved, keep the comment and mark the anchor as stale

### Out

- Resolving Bitbucket threads in MVP
- Re-writing other people's comments

## Acceptance criteria

- [ ] Open the same PR URL twice → same session, drafts intact
- [ ] Comments we published still appear after resume
- [ ] Host comments we did not write are visible
- [ ] A stale anchor is labeled, not silently dropped
- [ ] Resume works after a new fetch (S03)

## Tasks

- [ ] `listPublishedComments` on the host adapter
- [ ] Merge host + local comment views
- [ ] Stale-anchor heuristic (line hash / nearby symbol)
- [ ] High Seat context: "comments on this symbol"
- [ ] Tests: resume, stale line, missing host comment

## Depends on

- E08-S01, E08-S02, E08-S03
- E01-S01 resume-by-PR

## Open questions

- How aggressively we try to re-anchor after rebase
- Whether we hide resolved host threads
