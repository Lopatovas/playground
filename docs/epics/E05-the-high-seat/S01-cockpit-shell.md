# E05-S01 — Cockpit shell

**Epic:** E05 The High Seat  
**MVP:** Yes  
**Status:** Draft

## Outcome

The reviewer opens a session and sees a High Seat: header (PR/branch identity, feature title if we have one) and three panes. Empty states are designed. This is a cockpit, not a settings page.

## Scope

### In

- App chrome: header, three columns, session switcher
- Loading / error / empty session states
- Keyboard focus that can move between panes later
- Responsive: desktop first (this is a review workstation)

### Out

- Fancy graph (S02)
- Diff renderer (S03)
- Mobile-first consumer UI

## Acceptance criteria

- [ ] Opening a valid session shows header + three panes
- [ ] Header shows PR id or branch pair and base → head
- [ ] Missing graph / previews show pane-level empty states, not a blank window
- [ ] A failed session load is recoverable (back to open)
- [ ] Layout matches the brief closely enough to iterate on

## Tasks

- [ ] Choose UI stack (likely a local web app)
- [ ] Implement shell layout
- [ ] Header identity fields
- [ ] Empty/error/loading per pane
- [ ] Stub panes wired to session JSON
- [ ] Basic visual pass: dense, calm, not a marketing page

## Depends on

- E01-S04
- E07-S01

## Open questions

- Theme: dark-first for long review sessions?
- Do we show a feature name in the header before E02-S03 exists (first route / commit subject)?
