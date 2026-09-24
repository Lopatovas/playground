# E05-S04 — Context pane

**Epic:** E05 The High Seat  
**MVP:** Yes  
**Status:** Draft

## Outcome

The right pane answers "why am I looking at this?" for the current selection: consumers, routes, tests, layer, attention signal. Every item is a jump target, not a dead count.

## Scope

### In

- Consumers (count + list)
- Routes / features
- Related tests and stories
- Impact class + reasons
- Attention level + confidence + "signal" label
- Navigation: click consumer → select that node; click route → open preview; click test → open file

### Out

- Ticket description
- Author essay / AI summary
- Editable comments in MVP

## Acceptance criteria

- [ ] Selecting `customerApi.ts` can show consumers, routes, tests, attention
- [ ] Zero consumers / tests render as zero, not hidden
- [ ] Attention is labeled as a signal
- [ ] Each list item navigates somewhere useful
- [ ] Context updates with selection (S05)

## Tasks

- [ ] Context view model from session graph + attention
- [ ] Lists with jump actions
- [ ] Attention copy from E04-S04
- [ ] Empty subsections
- [ ] Tests via component/store fixtures if we have them

## Depends on

- E02-S02, S03, S04, S05
- E04-S03 when present
- E05-S01

## Open questions

- How many consumers we list before "show all"
- Do we show sample importers inline (3) plus a count?
