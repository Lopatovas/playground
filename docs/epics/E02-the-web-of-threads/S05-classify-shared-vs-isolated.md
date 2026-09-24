# E02-S05 — Classify shared vs isolated

**Epic:** E02 The Web of Threads  
**MVP:** Yes  
**Status:** Draft

## Outcome

Each changed file/symbol gets a deterministic impact class from graph facts: isolated leaf vs shared abstraction vs API/state spine. This is the first attention order. Jev may refine it later. It must not replace it.

## Scope

### In

- Heuristics on consumer count, route count, layer (API, store, page, leaf UI)
- Layer tags from path/name/adapter: `api`, `store`, `composable`, `page`, `component`, `util`
- An impact rank used by the High Seat when Jev is absent
- Explanations that are facts: "87 consumers, 14 routes, layer=api"

### Out

- Calling this a review result
- Using LOC as an input to the rank
- Model classification (E04)

## Acceptance criteria

- [ ] A new leaf component with 1 consumer ranks below a shared API with many consumers
- [ ] Rank is explained with counts and layer, not vibes
- [ ] LOC is not an input
- [ ] Ties are stable (name / path sort)
- [ ] The same graph produces the same class

## Tasks

- [ ] Define classes: `isolated`, `feature-local`, `shared`, `spine` (names TBD)
- [ ] Implement scoring from counts + layer only
- [ ] Store `impactClass`, `reasons[]`, and raw counts on each node
- [ ] Document the rules in this folder when they stabilize
- [ ] Fixture tests matching the brief's `customerApi` vs `CustomerCard` example

## Depends on

- E02-S02, E02-S03

## Open questions

- Exact class names and thresholds — needs a pass on a real 3k-line PR
- Do deleted shared files automatically become `spine`?
