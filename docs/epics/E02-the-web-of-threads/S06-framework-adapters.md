# E02-S06 — Framework adapters

**Epic:** E02 The Web of Threads  
**MVP:** Yes (one adapter)  
**Status:** Draft

## Outcome

The graph model stays generic. Framework knowledge lives in adapters that can see Vue SFCs, router tables, Pinia stores — or later React hooks, Next routes, server/client boundaries.

## Scope

### In

- Adapter interface: discover files, parse symbols, parse routes, tag layers
- First adapter: Vue (SFC, `<script setup>`, template component refs, Vue Router, Pinia/Vuex, API/service folders) **or** React/Next if that is the first repo
- Generic fallback: TS/JS modules only

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

- Confirm first framework with the real target repo
- How much Vue template resolution is required before the graph is "good enough"
