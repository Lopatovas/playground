# E05-S06 — Attention visualization

**Epic:** E05 The High Seat  
**MVP:** Yes (graph ranks if Jev is off)  
**Status:** Draft

## Outcome

The reviewer can see an attention map — bars, levels, categories — and use it as another way to select. It looks like a prioritization instrument, not a traffic-light exam.

## Scope

### In

- Bar list from E04-S03
- HIGH / MEDIUM / LOW / unmarked
- Click → linked selection
- Visible "signal, not a review" + confidence
- Optional category chips (`shared-abstraction`, `data-flow`, `ui-only`)

### Out

- Red/green pass-fail styling
- Hiding the rest of the PR
- Sorting by LOC "to fill the bar"

## Acceptance criteria

- [ ] Map renders from session data with Jev off
- [ ] Bars encode attention weight, not file size
- [ ] Copy cannot be read as a verdict
- [ ] Clicking a bar selects the node
- [ ] Unmarked nodes are still listed

## Tasks

- [ ] Attention map component
- [ ] Bind to E04-S03 model
- [ ] Guardrail copy from E04-S04
- [ ] Color system that is ordinal, not pass/fail (avoid green=good)
- [ ] Snapshot tests for copy and empty Jev

## Depends on

- E04-S03, E04-S04
- E05-S05

## Open questions

- Own pane vs a mode of the change map
- Do we use words only (HIGH) or also fill bars?
