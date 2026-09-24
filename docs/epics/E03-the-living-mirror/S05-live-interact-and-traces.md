# E03-S05 — Live interact and traces

**Epic:** E03 The Living Mirror  
**MVP:** After MVP  
**Status:** Draft

## Outcome

The reviewer can use the running PR app from the High Seat, and optionally keep video or a Playwright trace of what they did. Stills remain the default.

## Scope

### In

- Embed or pop out the live PR URL
- Optional Playwright trace / video on demand
- Replay a short interaction script if one already exists for the route
- Capture-after-interact stills

### Out

- Recording a full exploratory test suite
- Replacing QA tooling
- Auto-playing guessed user journeys

## Acceptance criteria

- [ ] Reviewer can open the live PR view for a selected route
- [ ] Optional trace/video is stored on the session when requested
- [ ] Live view does not block still comparison
- [ ] No interaction is required for the MVP stills path to work

## Tasks

- [ ] Live-view entry point from the High Seat
- [ ] On-demand `tracing.start` / video
- [ ] Hook to run an existing spec against one route
- [ ] Size / retention policy for traces

## Depends on

- E03-S02
- E05-S03 for the center-stage live toggle

## Open questions

- iframe vs opening a browser window (auth cookies, CSP)
- Do traces ever belong in the Chronicle, or only on the local session?
