# E01-S04 — Persist the review session

**Epic:** E01 The Opening  
**MVP:** Yes  
**Status:** Draft

## Outcome

The session is a directory (or equivalent) on disk. The Opening, the Web, the Mirror, and the Marks all read and write the same place. Closing the tool does not throw the analysis away.

## Scope

### In

- Local session store under a well-known path
- Schema version so later epics can migrate
- Write identity, git facts, and symbols
- Leave extension points for graph, previews, attention, receipt
- Load an existing session by id

### Out

- Multi-user server
- Cloud sync
- The Chronicle's public receipt format (E06) — session JSON is an internal store

## Acceptance criteria

- [ ] After `open` + ingest + symbols, a session can be loaded with the same data
- [ ] A second process can open the session without re-running git
- [ ] Schema has a version field
- [ ] Partial sessions are valid (graph missing, previews missing)
- [ ] Paths in the store are stable enough for later artifacts (screenshots, graphs)

## Tasks

- [ ] Decide store layout, e.g. `.scryglass/sessions/<id>/`
- [ ] Write `session.json` schema (identity + facts + symbols + slots)
- [ ] Add load / save / list commands
- [ ] Document what is safe to delete vs recompute
- [ ] Tests: round-trip, unknown future fields ignored, missing optional slots

## Depends on

- E01-S01, E01-S02, E01-S03 (can persist incrementally after each)

## Open questions

- Session next to the target repo vs in the user's home directory?
- Should `.scryglass/` be gitignored by convention in target repos?
