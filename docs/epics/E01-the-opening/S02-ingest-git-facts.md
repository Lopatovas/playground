# E01-S02 — Ingest git facts

**Epic:** E01 The Opening  
**MVP:** Yes  
**Status:** Draft

## Outcome

Given a session identity, Scryglass records the raw change: file list, statuses, hunks, and commit metadata. This is the factual substrate. It is not the impact graph.

## Scope

### In

- `git diff base...head` (merge-base aware)
- Per-file status: added, modified, deleted, renamed
- Hunks with line ranges
- Commit list between base and head (sha, author, subject, timestamp)
- Binary / generated / lockfile flags when cheap to detect

### Out

- Symbol extraction (S03)
- Consumer analysis (E02)
- Treating LOC as a risk score (forbidden)

## Acceptance criteria

- [ ] Session contains every path that git considers changed
- [ ] Renames are recorded as renames, not delete+add, when git says so
- [ ] Merge-base is used so feature-branch noise vs updated main is correct
- [ ] LOC may be stored as a fact and must not be used as an attention rank
- [ ] Binary files are listed without attempting a text diff

## Tasks

- [ ] Choose git invocation (`git` CLI vs `isomorphic-git` / `simple-git`)
- [ ] Compute merge-base and three-dot diff
- [ ] Parse file statuses and hunks into a typed model
- [ ] Attach commit metadata
- [ ] Heuristic skip/flag list: `package-lock.json`, `pnpm-lock.yaml`, `*.snap`, `dist/`, images
- [ ] Tests on a fixture repo with rename, delete, binary, and lockfile

## Depends on

- E01-S01

## Open questions

- How aggressive should generated-file suppression be in MVP?
- Do we store full patch text in the session or re-read git on demand?
