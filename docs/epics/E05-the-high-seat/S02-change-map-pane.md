# E05-S02 — Change map pane

**Epic:** E05 The High Seat  
**MVP:** Yes  
**Status:** Draft

## Outcome

The left pane is a semantic map of the change, not a file tree sorted by LOC. Shared spine nodes are obvious. Isolated leaves are present but visually quieter. Nodes are clickable.

## Scope

### In

- Tree or interactive graph of changed symbols / files and their nearby threads
- Grouping: routes, APIs, stores, pages, components
- Indicators from E02 impact class
- Search/filter by name
- Prefer interactive graph libraries (React Flow, Cytoscape) over a static Mermaid dump

### Out

- Using file size as row height
- Editing the graph
- Auto-layout that hides isolated files completely

## Acceptance criteria

- [ ] `customerApi` style nodes appear above leaf cards in default order
- [ ] Each row/node shows name + impact class, not "+3842"
- [ ] Clicking a node selects it (S05)
- [ ] Reviewer can still reach a LOW isolated file
- [ ] Graph/tree is usable on a real 40-file PR without freezing

## Tasks

- [ ] Spike React Flow vs Cytoscape vs a dense tree for 40–200 nodes
- [ ] Map session graph → view model
- [ ] Default grouping and sort
- [ ] Selection + keyboard j/k
- [ ] Performance budget and virtualization if needed

## Depends on

- E02-S02, E02-S05
- E05-S01

## Open questions

- Tree first (faster) vs graph first (closer to the brief)
- How we draw the Route → Page → Store → API spine without a mess
