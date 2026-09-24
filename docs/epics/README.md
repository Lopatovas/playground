# Epics

Eight epics cover Scryglass. Each folder has an `epic.md` plus one file per story. Stories contain tasks.

Status on everything is **Draft**. We iterate here.

## Map (by job)

```text
E07 Foundry + E01 Opening ──────────────── floor

Job 1  what it is     E03 Living Mirror
Job 2  where to look  E02 Web of Threads → E04 Whisper Marks
Job 3  review UX      E05 High Seat → E08 Palimpsest

E06 Chronicle ──────────────── later
```

```text
E07 The Foundry
        │
        ▼
E01 The Opening
        │
        ▼
E02 The Web of Threads ── job 2
        │
        ├──────────► E03 The Living Mirror ── job 1
        │
        └──────────► E04 The Whisper Marks ── job 2 (optional sharpener)
                        │
                        ▼
                   E05 The High Seat ── job 3 surface
                        │
                        ├──────────► E08 The Palimpsest ── job 3
                        │
                        └──────────► E06 The Chronicle ── later
```

## How to read a story

- **Outcome** — what the reviewer can do
- **Scope** — in / out
- **Acceptance criteria** — testable
- **Tasks** — implementation slices
- **Depends on** — other stories
- **Open questions** — leftover decisions

MVP tags: **MVP** / **After MVP** / **Stretch**

## Iteration notes

- All three jobs are in MVP. Do not ship a cockpit that only diffs.
- E02 is the floor of job 2. If `customerApi` does not outrank a one-page heading, the epic failed.
- E04 may stay stubbed. Job 2 does not wait on TypeSafe.
- E08 is core (job 3). Do not slip it behind Chronicle.
- E02/E03 degrade on PHP/Electron; session + Palimpsest must still work.
