# Epics

Seven epics cover Scryglass. Each folder has an `epic.md` plus one file per story. Stories contain tasks.

Status on everything is **Draft**. We iterate here.

## Map

```text
E07 The Foundry ──────────────────────────────── floor
        │
        ▼
E01 The Opening ── session, git facts, symbols
        │
        ▼
E02 The Web of Threads ── impact graph from repository facts
        │
        ├──────────► E03 The Living Mirror ── render + compare UI
        │
        └──────────► E04 The Whisper Marks ── optional attention signals
                        │
                        ▼
                   E05 The High Seat ── the cockpit
                        │
                        ▼
                   E06 The Chronicle ── the receipt
```

## How to read a story

Every story file uses the same shape:

- **Outcome** — what the reviewer can do
- **Scope** — in / out
- **Acceptance criteria** — testable
- **Tasks** — implementation slices
- **Depends on** — other stories
- **Open questions** — things we should decide together

MVP tags:

- **MVP** — needed for the first useful loop
- **After MVP** — real, but not the first cut
- **Stretch** — only if it falls out cheaply

## Iteration notes

This is a first decomposition. Likely cuts in the next pass:

- E03-S04 / S05 / S06 may collapse until one repo's preview story is real
- E04 can wait if Jev is undefined; E02 ranks can fill the attention map
- E06 can stay a session JSON export until the cockpit loop is loved
- E07-S03 (plugin model) may be premature if we only have one adapter
