# E04-S03 — Compose the attention map

**Epic:** E04 The Whisper Marks  
**MVP:** Yes (deterministic-only is fine)  
**Status:** Draft

## Outcome

The session has one attention map the High Seat can draw:

```text
██████████  customerApi.ts        HIGH
████████    useCustomerStore.ts   HIGH
██████      CustomerPage.vue      MEDIUM
██          CustomerCard.vue      LOW
```

Order comes from E02 impact first. Jev may boost or annotate. Disagreement is visible.

## Scope

### In

- Merge rules: graph class + optional Jev mark
- Per-node: level, bar weight, reasons, sources (`graph`, `jev`)
- Map-level counts: high / medium / low / unmarked
- Stable sort

### Out

- Hiding low-impact files entirely (they stay reachable)
- Using LOC to sort
- Auto-collapsing the PR to "the AI said look at these three files only"

## Acceptance criteria

- [ ] With Jev off, the map still ranks by E02-S05
- [ ] With Jev on, marks appear as an extra source, not a replacement
- [ ] If Jev says low and the graph says spine, the UI can show both (rule TBD)
- [ ] Sort is stable without LOC
- [ ] Map is stored on the session for the Chronicle

## Tasks

- [ ] Define merge policy (proposal: graph sets floor, Jev can raise, never lower a spine node)
- [ ] Build `AttentionMap` model
- [ ] Unit tests for Jev-off, Jev-on, Jev-conflict, Jev-missing
- [ ] Snapshot example matching the brief

## Depends on

- E02-S05
- E04-S02 optional

## Open questions

- Confirm merge policy: can Jev ever lower a shared API?
- How many nodes do we show before the map needs grouping?
