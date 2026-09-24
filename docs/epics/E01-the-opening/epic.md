# E01 — The Opening

**Practical name:** PR ingestion and review session  
**Status:** Draft  
**MVP:** Yes  
**Job:** floor — every job starts here

## Intent

A reviewer pastes a Bitbucket PR URL. Scryglass identifies the PR, fetches it, checks it out into a workdir it owns, reads git facts, names the symbols that actually changed, and opens a session every later epic can attach to.

The reviewer should not have to clone by hand.

## Why this epic exists

Bitbucket already has a diff. That is not enough. We need a **session**: a stable local object that knows the PR, base, head, files, symbols, and later graph / preview / comments.

## Outcomes

- `scryglass open <bitbucket-pr-url>` is the normal start
- Scryglass fetches and checks out without a pre-existing local clone
- Changed work is named at symbol level when the language adapter can
- Re-opening the same PR resumes the session (Palimpsest)

## In scope

- Bitbucket PR URL (local `branch + base` as an escape hatch)
- Auto fetch / checkout into a Scryglass workdir
- Git diff, changed files, commit metadata
- Changed-symbol extraction with a generic JS/TS floor
- Local session persistence keyed by host + PR id

## Out of scope

- Impact graph (E02)
- Rendering (E03)
- Jev (E04)
- Cockpit chrome (E05)
- Publishing comments (E08)
- GitHub / GitLab (adapter interface only)

## Stories

| ID | Title | MVP |
| --- | --- | --- |
| [S01](./S01-open-review-session.md) | Open a review session from a PR URL | Yes |
| [S02](./S02-ingest-git-facts.md) | Ingest git facts | Yes |
| [S03](./S03-extract-changed-symbols.md) | Extract changed symbols | Yes |
| [S04](./S04-persist-review-session.md) | Persist the review session | Yes |
| [S05](./S05-fetch-and-checkout.md) | Fetch and checkout | Yes |

## Dependencies

- E07-S01 (runtime)
- E07 host adapter (Bitbucket)

## Open questions

- Bitbucket Cloud vs Data Center API
- Where workdirs live, and when we delete them
- How we handle generated files, lockfiles, and snapshots so they do not drown The Opening
