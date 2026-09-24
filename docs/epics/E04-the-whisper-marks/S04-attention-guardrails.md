# E04-S04 — Attention guardrails

**Epic:** E04 The Whisper Marks  
**MVP:** Yes  
**Status:** Draft

## Outcome

There is no product path where a Whisper Mark becomes a review, an approval, or a merge gate. Types, UI copy, and receipts all enforce that.

## Scope

### In

- Forbidden words in Jev-facing UI: review, approval, LGTM, correct, block
- Required words: signal, likely, confidence
- Receipt section that says classifications are non-blocking
- API types that cannot carry `approved: true`

### Out

- A policy engine
- Legal disclaimers as a substitute for good UI
- Stripping useful categories because they sound sharp (`shared-abstraction` is fine)

## Acceptance criteria

- [ ] Session schema has no approval/review verdict field
- [ ] High Seat attention chrome includes "signal, not a review"
- [ ] Chronicle Jev section states no blocking decisions
- [ ] A lint or test fails if new copy introduces forbidden verdict language in attention components
- [ ] Never-block is documented as a principle, not a setting

## Tasks

- [ ] Copy list for attention UI
- [ ] Type-level ban on verdict fields
- [ ] Receipt required sentence
- [ ] Simple copy test / snapshot on attention components when they exist
- [ ] Add this story to the principles cross-check

## Depends on

- E04-S03
- E05-S06 and E06-S02 consume the copy

## Open questions

- Is a hidden "debug: model raw JSON" view OK for developers?
- Do we allow "unusual" as a category name, or is that already too judgmental?
