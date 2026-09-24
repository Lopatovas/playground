# E02-S01 — Build the dependency graph

**Epic:** E02 The Web of Threads  
**MVP:** Yes  
**Status:** Draft

## Outcome

Scryglass can produce a deterministic import/export graph for the target repo (or the neighborhood of changed files). Nodes are files and, where cheap, symbols. Edges are repository facts.

## Scope

### In

- TypeScript / JavaScript module graph
- Existing tools as candidates: TS compiler API, ts-morph, dependency-cruiser, Madge
- Re-exports and path aliases used by the target repo
- Vue/React file nodes even if symbol edges come in S06

### Out

- Runtime dynamic `import()` resolution beyond static strings
- CSS-only graphs in MVP
- Model-generated "probable dependencies"

## Acceptance criteria

- [ ] Given a fixture app, importing `a → b → c` is present in the graph
- [ ] Path aliases used by the target repo resolve
- [ ] The graph is reproducible on the same commit
- [ ] Build failure on one file does not drop the whole graph
- [ ] Graph provenance is stored (tool + version + commit)

## Tasks

- [ ] Spike ts-morph vs dependency-cruiser vs Madge against the first target repo
- [ ] Define `GraphNode` / `GraphEdge` types (`file`, `symbol`, edge kinds: `imports`, `exports`, `reexports`)
- [ ] Implement file-level graph first
- [ ] Add symbol-level edges for exported bindings when available
- [ ] Cache the graph on the session keyed by `headSha`
- [ ] Fixture tests for barrel files and path aliases

## Depends on

- E01-S04 (somewhere to write the graph)
- E02-S06 may deepen node types

## Open questions

- Full-repo index on first open vs incremental around the diff
- Do we persist the whole graph or only the sliced blast-radius subgraph?
