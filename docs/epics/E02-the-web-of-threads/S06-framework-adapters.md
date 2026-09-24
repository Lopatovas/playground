# E02-S06 — Framework adapters

**Epic:** E02 The Web of Threads  
**MVP:** Yes (generic floor; one framework adapter only if a dogfood PR needs it)  
**Status:** Draft

## Outcome

The graph model stays generic. Adapter Zero is TS/JS modules — that is enough for job 2 on many PRs. Vue, React, and Next make routes and templates better. PHP and Electron still get a session and a file-level map.

## Scope

### In

- Adapter interface: discover files, parse symbols, parse **layer anchors** (router, defineStore, file routes). Core walks the DAG — see [layer-detection.md](../../../layer-detection.md)
- Adapter Zero: TS/JS modules (MVP floor)
- Adapter One when a real PR needs it: Vue SFC / Vue Router / Pinia **or** React/Next
- Capability flags so a PHP+Vue repo can use Vue where files are Vue, and file-level elsewhere

### Out

- Shipping two complete adapters in MVP
- Framework-specific UI in the High Seat
- Assuming every repo is Vue because the brief's examples are Vue

## Acceptance criteria

- [ ] Graph construction calls an adapter, not `if (vue)` sprinkled everywhere
- [ ] The first adapter can extract a component referenced only in a template
- [ ] Stores and router files receive the right layer tags
- [ ] A repo the adapter does not understand still gets a TS module graph
- [ ] Adding a second adapter does not change session schema

## Tasks

- [ ] Write the adapter interface
- [ ] Implement Adapter Zero: TS/JS modules
- [ ] Implement Adapter One for the chosen first framework
- [ ] Template-component and composable resolution for Vue, **or** hooks/routes for React
- [ ] Contract tests on a tiny fixture app per adapter

## Depends on

- E07-S03 (plugin/runtime shape) — can start as in-process modules
- E01-S03, E02-S01, E02-S03 consume adapter output

## Open questions

- Which real PR we dogfood first (that picks Adapter One)
- How much template resolution job 2 needs before a shared API still outranks a heading
