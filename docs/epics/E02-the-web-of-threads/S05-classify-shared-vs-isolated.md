# E02-S05 — Classify shared vs isolated

**Epic:** E02 The Web of Threads  
**MVP:** Yes  
**Status:** Draft

## Outcome

Job 2's core rule: each changed file/symbol gets a deterministic impact class from graph facts. A one-page heading is quiet. A shared API abstraction is loud. Jev may refine this later. It must not replace it.

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

- [ ] A heading / leaf component used on one page ranks below a shared API abstraction
- [ ] Rank is explained with counts and layer, not vibes
- [ ] LOC is not an input (a 3,000-line isolated page can still be `isolated`)
- [ ] Ties are stable (name / path sort)
- [ ] The same graph produces the same class

## Tasks

- [ ] Define classes: `isolated`, `feature-local`, `shared`, `spine` (names TBD)
- [ ] Implement scoring from counts + layer only
- [ ] Store `impactClass`, `reasons[]`, and raw counts on each node
- [ ] Document the rules in this folder when they stabilize
- [ ] Fixture tests: `customerApi` (many consumers) vs `SettingsHeading` (one page) vs a large isolated page
- [ ] `node fixtures/blast-radius.mjs --check` stays green (current dogfood until Bitbucket access)

## Depends on

- E02-S02, E02-S03

## Open questions

- Exact class names and thresholds — needs a pass on a real 3k-line PR
- Do deleted shared files automatically become `spine`?
