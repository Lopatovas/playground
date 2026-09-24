# E03-S01 — Discover render targets

**Epic:** E03 The Living Mirror  
**MVP:** Yes  
**Status:** Draft

## Outcome

Scryglass proposes a list of things to open in a browser without asking the author to configure every PR. Sources are ordered from repository facts, then optional hints.

## Scope

### In

Discovery sources, in preference order:

1. Changed route definitions
2. Changed page components (via E02)
3. Routes that consume changed symbols
4. Changed Storybook stories (may be empty in MVP)
5. Changed tests / existing Playwright specs
6. Optional review manifest (E03-S06)

Each target: path, source, confidence, suggested viewport (default desktop).

### Out

- Actually launching the browser (S02)
- Requiring a manifest
- Crawling the entire app

## Acceptance criteria

- [ ] A PR that edits `/customers` page yields `/customers` as a target
- [ ] A shared store used by two routes yields both routes
- [ ] Targets are de-duplicated
- [ ] Each target records why it was chosen
- [ ] An empty target list is explicit, not a crash

## Tasks

- [ ] Define `RenderTarget` (`kind: route | story | spec`, `path`, `source`, `confidence`)
- [ ] Collect from E02 route attribution
- [ ] Collect from changed router files
- [ ] Optional: parse existing Playwright `page.goto` strings
- [ ] Rank targets (changed page > transitive consumer route)
- [ ] Tests on a fixture with one direct and one transitive route

## Depends on

- E02-S03
- E02-S04 for spec/story hints

## Open questions

- Cap how many routes we auto-open on a 3k-line PR?
- Do query-param variants count as separate targets?
