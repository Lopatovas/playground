# E03-S04 — Viewports and states

**Epic:** E03 The Living Mirror  
**MVP:** After MVP (MVP ships one desktop still)  
**Status:** Draft

## Outcome

The reviewer can switch desktop / tablet / mobile and inspect loading, empty, populated, and error when those states can be produced deterministically.

## Scope

### In

- Viewport presets
- State drivers: query flags, fixtures, MSW, existing test harness — whatever the target repo already has
- Matrix: target × viewport × state, with a cap
- High Seat control to switch among captured variants

### Out

- Inventing a full data layer for every app
- Claiming we covered "all states"

## Acceptance criteria

- [ ] The same route can have multiple captures distinguished by viewport and state
- [ ] Missing states are omitted, not faked
- [ ] Switching viewport in the UI shows the matching still (or live resize in S05)
- [ ] State source is recorded (`fixture`, `query`, `manifest`, `unknown`)

## Tasks

- [ ] Define viewport presets
- [ ] Define a `UiState` enum: `loading | empty | populated | error | unknown`
- [ ] Adapter hook: "how does this repo force a state?"
- [ ] Capture matrix with a hard cap
- [ ] Tests for three viewports and one forced empty state on a fixture

## Depends on

- E03-S02
- E07-S04

## Open questions

- Does the first target repo already have a way to force empty/error?
- Is mobile capture worth anything before live interact exists?
