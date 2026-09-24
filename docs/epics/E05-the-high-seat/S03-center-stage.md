# E05-S03 — Center stage: code and preview

**Epic:** E05 The High Seat  
**MVP:** Yes  
**Status:** Draft

## Outcome

The middle pane is where the reviewer *looks*. They can toggle or split **diff** and **rendered UI** for the current selection. This is the replacement for "only Bitbucket diff."

## Scope

### In

- Diff view for the selected file/symbol (hunk-aware, symbol-scoped when possible)
- Preview view: stills from E03, BASE | PR | DIFF when present
- Toggle / split between code and UI
- Jump to full file context, not only the hunk
- Later: live PR (E03-S05)

### Out

- Full IDE editing
- Host comment UX in MVP
- Playing video as the default

## Acceptance criteria

- [ ] Selecting a file shows its diff
- [ ] Selecting a symbol scrolls to / highlights that symbol's hunks
- [ ] If a render target exists, the reviewer can see the still without leaving the seat
- [ ] BASE | PR | DIFF works when comparison artifacts exist
- [ ] Missing preview is a quiet empty state, not an error

## Tasks

- [ ] Diff renderer (Monaco, CodeMirror, or a purpose-built hunk view)
- [ ] Symbol-to-hunk mapping from E01-S03
- [ ] Image viewer for stills and visual diffs
- [ ] Toggle/split controls
- [ ] "Open live PR" button when URL exists

## Depends on

- E01-S02, E01-S03
- E03-S02 / S03 when previews exist
- E05-S01

## Open questions

- Side-by-side vs unified diff default
- Do we syntax-highlight Vue SFCs well enough in MVP?
