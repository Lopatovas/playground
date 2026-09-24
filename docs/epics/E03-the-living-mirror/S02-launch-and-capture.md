# E03-S02 — Launch and capture

**Epic:** E03 The Living Mirror  
**MVP:** Yes  
**Status:** Draft

## Outcome

Playwright starts the PR application, navigates each chosen target, and stores screenshots on the session. The reviewer can look at the feature, not only the diff.

## Scope

### In

- Use Playwright, not a commercial host
- Boot the PR checkout via the Foundry app-lifecycle
- Navigate listed routes
- Capture a still per target (desktop viewport in MVP)
- Store images + metadata (url, sha, viewport, timestamp, errors)
- Survive a single route failure without failing the whole preview

### Out

- Base comparison (S03)
- Video / traces (S05)
- Full state matrix (S04)
- Starting Storybook (S06)

## Acceptance criteria

- [ ] A successful boot produces at least one screenshot for a valid route
- [ ] Screenshots live on the session and can be shown in the High Seat
- [ ] A 404 or timeout is recorded as a failed target with the error
- [ ] Viewport, wait strategy, and URL are stored for replay
- [ ] Capture is deterministic enough to compare later (fixed viewport, no random seed if we control it)

## Tasks

- [ ] Add Playwright as the capture runner
- [ ] Integrate E07-S02 boot (URL, ready-signal)
- [ ] Navigate + wait (networkidle vs test-id vs timeout — pick one default)
- [ ] Save PNG + sidecar JSON per target
- [ ] Record console errors as context, not as a failed review
- [ ] Tests against a tiny static or fixture app

## Depends on

- E03-S01
- E07-S02

## Open questions

- Wait strategy for SPAs
- Do we capture only after a known selector, or after a fixed delay in MVP?
- Hosted app vs `npm run dev` on an ephemeral port
