# E05-S05 — Linked selection

**Epic:** E05 The High Seat  
**MVP:** Yes  
**Status:** Draft

## Outcome

One current symbol/file is the cursor of the High Seat. Clicking it in the map, a consumer list, a route, or a test updates **all three panes**. This is the search-cost feature. If this is clunky, the product failed.

## Scope

### In

- A single `selectedId` on the session / UI store
- Selection sources: map, context jumps, center-stage file tabs, attention bars
- Deep link: `?session=&select=`
- History: back/forward through selections

### Out

- Multi-select editing
- Independent pane cursors as the default (optional later: pin)

## Acceptance criteria

- [ ] Click `customerApi.ts` → diff, graph highlight, context, related preview all update
- [ ] Click a consumer in context → that consumer becomes the selection
- [ ] Click a route → preview navigates to that target if captured
- [ ] Refreshing the URL restores the selection
- [ ] No pane is more than one click out of date

## Tasks

- [ ] Define selection IDs (file path + optional symbol)
- [ ] UI store + URL sync
- [ ] Wire map, stage, context, attention
- [ ] Selection history
- [ ] Manual test script on the fixture PR used in stories above

## Depends on

- E05-S02, S03, S04

## Open questions

- File-level vs symbol-level selection as the primary cursor
- Pin-one-pane behavior — later?
