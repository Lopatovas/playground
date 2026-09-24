# E06-S02 — Generate human + machine receipts

**Epic:** E06 The Chronicle  
**MVP:** After MVP  
**Status:** Draft

## Outcome

From a session, Scryglass writes `receipt.json` and `receipt.md`. The markdown is skimmable. The JSON is complete. Neither claims the PR was reviewed.

## Scope

### In

- Generator from session → receipt
- Markdown layout close to the brief's "PR REVIEW RECEIPT" block
- Required Jev disclaimer sentence
- CLI / High Seat export action

### Out

- Pretty PDF
- Auto-posting to Bitbucket
- Generating a narrative essay

## Acceptance criteria

- [ ] A session with graph + previews + marks produces both files
- [ ] A session with only E01+E02 still produces a valid thinner receipt
- [ ] Markdown includes the no-blocking sentence when Jev data exists
- [ ] Re-generating is deterministic given the same session

## Tasks

- [ ] Mapper session → receipt
- [ ] Markdown template
- [ ] Export command and UI button
- [ ] Golden-file tests for the brief example

## Depends on

- E06-S01
- E04-S04

## Open questions

- Filename and folder (`<session>/chronicle/` vs stdout)
- Do we embed relative links to stills in the markdown?
