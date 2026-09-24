# E05 — The High Seat

**Practical name:** Review cockpit UI  
**Status:** Draft  
**MVP:** Yes (thin three-pane)

## Intent

The High Seat is where the reviewer sits. One selection updates the change map, the feature/diff stage, and the context rail. Signal → context → code → rendered result should feel like one motion, not three tools.

Suggested skeleton:

```text
┌──────────────────────────────────────────────────────────────┐
│ PR #123   Feature: Customer Search                          │
├───────────────┬──────────────────────────┬───────────────────┤
│ CHANGE MAP    │ FEATURE / DIFF            │ CONTEXT           │
│               │                           │                   │
│ customerApi   │ code / rendered UI       │ consumers: 87     │
│   ├─ store    │                           │ route: /customer  │
│   └─ page     │                           │ tests: 31         │
│               │                           │ attention: HIGH   │
│ routes        │                           │                   │
│ components    │                           │                   │
└───────────────┴──────────────────────────┴───────────────────┘
```

## Why this epic exists

Analysis that cannot be navigated does not reduce search cost. Bitbucket's diff UX is not this workflow.

## Outcomes

- Opening a session shows the cockpit immediately
- Clicking `customerApi.ts` shows its diff, consumers, routes, attention, tests, and a path to UI
- Attention chrome is visibly non-authoritative
- The reviewer never has to start from a 3,000-line file list

## In scope

- Shell and header
- Change map pane
- Center stage (code + preview)
- Context pane
- Linked selection
- Attention visualization

## Out of scope

- Rebuilding a generic Git client
- Host comment threads in MVP
- Ticket body as a required panel

## Stories

| ID | Title | MVP |
| --- | --- | --- |
| [S01](./S01-cockpit-shell.md) | Cockpit shell | Yes |
| [S02](./S02-change-map-pane.md) | Change map pane | Yes |
| [S03](./S03-center-stage.md) | Center stage: code and preview | Yes |
| [S04](./S04-context-pane.md) | Context pane | Yes |
| [S05](./S05-linked-selection.md) | Linked selection | Yes |
| [S06](./S06-attention-visualization.md) | Attention visualization | Yes (can use graph ranks) |

## Dependencies

- E01 session
- E02 graph (map and context are empty without it)
- E03 stills when present
- E04 map when present

## Open questions

- Web app vs desktop wrapper
- Graph library: React Flow, Cytoscape, D3, Mermaid — prefer clickable, not a static diagram
- How much of the original host diff we try to emulate vs replace
