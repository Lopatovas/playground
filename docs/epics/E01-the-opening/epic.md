# E01 — The Opening

**Practical name:** PR ingestion and review session  
**Status:** Draft  
**MVP:** Yes

## Intent

A reviewer points Scryglass at a change. Scryglass resolves the refs, reads git facts, names the symbols that actually changed, and opens a local review session that every later epic can attach to.

Without The Opening there is no glass to look through.

## Why this epic exists

Bitbucket (or any host) already has a diff. That is not enough. We need a **session**: a stable local object that knows base, head, files, symbols, and later graph / preview / attention results.

## Outcomes

- A reviewer can open a PR URL or a `branch + base` pair
- Scryglass knows exactly which commits and files are in play
- Changed work is named at symbol level, not only file level
- Later epics write into the same session rather than re-parsing git

## In scope

- Input: PR URL and/or local branch + base
- Git diff, changed files, commit metadata
- Changed-symbol extraction for the first language/framework cut
- Local session persistence

## Out of scope

- Impact graph (E02)
- Rendering (E03)
- Jev (E04)
- Cockpit chrome (E05)
- Posting anything back to the host

## Stories

| ID | Title | MVP |
| --- | --- | --- |
| [S01](./S01-open-review-session.md) | Open a review session | Yes |
| [S02](./S02-ingest-git-facts.md) | Ingest git facts | Yes |
| [S03](./S03-extract-changed-symbols.md) | Extract changed symbols | Yes |
| [S04](./S04-persist-review-session.md) | Persist the review session | Yes |

## Dependencies

- E07-S01 (local runtime) to have somewhere to run this
- A target git checkout Scryglass can read

## Open questions

- Do we talk to Bitbucket/GitHub APIs, or is local git enough for MVP?
- What is the first language set? Brief assumes TS/JS + Vue SFC.
- How do we handle generated files, lockfiles, and snapshots so they do not drown The Opening?
