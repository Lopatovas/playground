# E06-S03 — Handoff artifact

**Epic:** E06 The Chronicle  
**MVP:** After MVP  
**Status:** Draft

## Outcome

Another engineer or agent can pick up a receipt and know: what to look at first, what was rendered, what was only a signal, and where the local session lives if they have the same checkout.

## Scope

### In

- Receipt includes session id, SHAs, and a "how to reopen" line
- Agent-oriented JSON is self-contained enough to list jump targets
- Human-oriented markdown can be pasted into a PR description *as notes*, not as approval
- Documented convention: receipt ≠ review

### Out

- Remote session sharing
- Assigning reviewers
- Closing the loop with merge

## Acceptance criteria

- [ ] A second person with the repo and the receipt can run `scryglass open --session <id>` or recreate from SHAs
- [ ] An agent can parse jump targets (files, symbols, routes) without reading markdown
- [ ] Docs state the receipt is observational
- [ ] Pasting markdown into a host PR cannot be mistaken for "Scryglass approved this" if the disclaimer is left intact

## Tasks

- [ ] Reopen-from-receipt path
- [ ] `jumpTargets[]` in JSON
- [ ] Short "how to use this receipt" note in `docs/`
- [ ] Manual handoff rehearsal on a real PR

## Depends on

- E06-S02
- E01-S01 / S04

## Open questions

- Will agents consume this before humans do?
- Do we want a signed/hashed receipt, or is that ceremony?
