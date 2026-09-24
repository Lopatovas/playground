# E02-S02 — Resolve consumers and blast radius

**Epic:** E02 The Web of Threads  
**MVP:** Yes  
**Status:** Draft

## Outcome

For each changed symbol or file, Scryglass lists who uses it and how wide the change can reach. This is the number that should scare a reviewer more than LOC.

## Scope

### In

- Reverse edges: consumers of a file / exported symbol
- Counts: consumers, distinct features (once S03 exists), distinct routes
- Depth-limited walk so a `utils` change does not explode the UI
- Distinguish direct vs transitive consumers

### Out

- Runtime call-graph from tests
- "This might be called via DI / string name" guesses
- Ranking copy that says HIGH/MEDIUM/LOW — that is E02-S05 / E04

## Acceptance criteria

- [ ] A changed exported function shows every static importer in the fixture
- [ ] Consumer counts match the fixture's known graph
- [ ] Direct and transitive consumers are separable
- [ ] Walks have a documented depth / node cap
- [ ] Deleted symbols still show former consumers when the base graph is available

## Tasks

- [ ] Prefer `blast-radius file|files --format json` (downstream consumers are the product)
- [ ] Build reverse index from S01 only if the CLI is unavailable
- [ ] Slice subgraph for changed files/symbols
- [ ] Compute counts used later by the High Seat context pane
- [ ] Handle new files (consumers = 0 or only self)
- [ ] Tests: shared helper, leaf component, barrel re-export, deleted export

## Depends on

- E02-S01
- E01-S03 (the changed symbol list)

## Open questions

- Do we compute a base-branch graph as well so deleted-export consumers are accurate in MVP?
- Cap: depth 3? 200 nodes? Needs a feel pass on a real repo.
