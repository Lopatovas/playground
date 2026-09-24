# E07-S03 — Adapter plugin model

**Epic:** E07 The Foundry  
**MVP:** Yes (in-process modules)  
**Status:** Draft

## Outcome

Framework-specific intelligence is isolated. The rest of Scryglass speaks files, symbols, routes, layers, and render targets. Adding React later should not rewrite The Opening or the High Seat.

## Scope

### In

- Adapter interface used by E01-S03, E02, E03-S01
- Built-in TS adapter + one framework adapter
- Capability flags: `routes`, `templates`, `stores`, `stories`
- Discovery: which adapter applies to this repo

### Out

- A marketplace
- WASM plugins
- Per-company adapters in MVP

## Acceptance criteria

- [ ] Core packages do not import Vue or Next directly
- [ ] Adapter selection is explicit or clearly detected
- [ ] Missing capability degrades (no routes) instead of crashing
- [ ] Contract tests lock the interface before the second adapter exists

## Tasks

- [ ] Write `ScryglassAdapter` interface
- [ ] Register adapters in Foundry config
- [ ] Detection heuristic (package.json deps) with override
- [ ] Shared fixture harness for adapters
- [ ] Document how to add Adapter Two

## Depends on

- E07-S01
- E02-S06 is the first consumer

## Open questions

- One package vs `adapters/vue`, `adapters/react`
- How much of "API layer" tagging is convention (`src/api`) vs adapter logic?
