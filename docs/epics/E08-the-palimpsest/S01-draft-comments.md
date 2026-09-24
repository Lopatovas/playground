# E08-S01 — Draft comments in the High Seat

**Epic:** E08 The Palimpsest  
**MVP:** Yes  
**Status:** Draft

## Outcome

The reviewer can write comments while looking at a symbol, a hunk, or the whole PR, without publishing yet. Drafts live on the session. Closing the laptop does not lose them.

## Scope

### In

- General PR comment
- Inline on file + line
- Inline on a symbol (stored as file + line range + symbol id)
- Edit / delete drafts
- Draft count in the High Seat chrome
- Markdown is enough

### Out

- Publishing (S02)
- AI suggestions
- Threaded replies in MVP (can display host threads later)

## Acceptance criteria

- [ ] A draft can be attached to the current selection
- [ ] A general draft has no file anchor
- [ ] Drafts persist with the session
- [ ] Publishing is a separate action (nothing leaves the machine yet)
- [ ] Empty drafts cannot be saved

## Tasks

- [ ] `DraftComment` type (`id`, `anchor`, `body`, `createdAt`, `updatedAt`)
- [ ] Anchor: `general | { file, line?, symbolId? }`
- [ ] High Seat compose UI on center stage + a drafts drawer
- [ ] Session load/save
- [ ] Tests: create, edit, delete, resume

## Depends on

- E05-S01, E05-S03, E05-S05
- E01-S04

## Open questions

- One compose box vs per-hunk boxes (GitHub-style)
- Do we show existing Bitbucket comments next to drafts in this story, or in S04?
