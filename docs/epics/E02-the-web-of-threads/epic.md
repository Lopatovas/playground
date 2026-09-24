# E02 — The Web of Threads

**Practical name:** Deterministic impact graph  
**Status:** Draft  
**MVP:** Yes

## Intent

From changed symbols, compute what the change can reach. The graph is made of repository facts: imports, exports, consumers, routes, tests, shared utilities.

A model does not draw these edges.

## Why this epic exists

Raw LOC hides the real review problem. Editing `customerApi.ts` (87 consumers, 14 features) is a different event from adding `CustomerCard.vue` (1 consumer). The Web is how Scryglass says that without guessing.

Useful spine:

```text
Route → Page → Composable / Hook → Store → API abstraction → HTTP client
```

Also: imports, exports, changed symbols, changed routes, shared components, shared utilities, state, API boundaries, related tests.

## Outcomes

- Every changed symbol can answer: who consumes me, which features, which tests
- Shared nodes are distinguishable from isolated leaves using graph facts
- The High Seat can render an interactive map from this data
- Whisper Marks may *rank* these nodes; they may not invent them

## In scope

- File and symbol dependency graph
- Consumer / blast-radius resolution
- Route and feature mapping
- Related tests and stories
- Deterministic shared-vs-isolated
- Framework adapters that feed the same graph model

## Out of scope

- Drawing the cockpit (E05)
- Calling Jev (E04)
- Claiming the graph is a security or correctness proof
- LLM "this looks like a service layer"

## Stories

| ID | Title | MVP |
| --- | --- | --- |
| [S01](./S01-build-dependency-graph.md) | Build the dependency graph | Yes |
| [S02](./S02-resolve-consumers.md) | Resolve consumers and blast radius | Yes |
| [S03](./S03-map-routes-and-features.md) | Map routes and features | Yes |
| [S04](./S04-attach-tests-and-stories.md) | Attach tests and stories | Yes (thin) |
| [S05](./S05-classify-shared-vs-isolated.md) | Classify shared vs isolated | Yes |
| [S06](./S06-framework-adapters.md) | Framework adapters | Yes (one adapter) |

## Dependencies

- E01 session with files and symbols
- E07 adapter / language tooling

## Open questions

- Whole-repo graph vs graph-around-changed-files only for MVP performance
- How we name a "feature" when the repo has no formal feature folders
- Vue-first vs React-first (brief examples are Vue; architecture should stay generic)
