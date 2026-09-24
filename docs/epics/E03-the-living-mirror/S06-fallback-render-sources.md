# E03-S06 — Storybook and review manifest

**Epic:** E03 The Living Mirror  
**MVP:** After MVP  
**Status:** Draft

## Outcome

When routes cannot be booted, Scryglass can still show something: changed stories, or an optional author-provided manifest. The manifest is a fallback, never the primary way the product works.

## Scope

### In

- Detect Storybook and render changed stories
- Optional `scryglass.yml` / `review:` manifest:

```yaml
review:
  routes:
    - path: /customers
      states: [populated, empty, error]
  stories:
    - CustomerCard
    - CustomerSearch
```

- Manifest merges with, not replaces, discovered targets

### Out

- Requiring a manifest on every PR
- Chromatic or other commercial story browsers as a core dependency

## Acceptance criteria

- [ ] A repo with no manifest still discovers routes (S01)
- [ ] A manifest adds targets that discovery missed
- [ ] Changed stories appear as render targets when Storybook can boot
- [ ] Invalid manifest fails soft and reports the parse error

## Tasks

- [ ] Manifest schema + parser
- [ ] Merge algorithm (discovery ∪ manifest)
- [ ] Storybook boot convention
- [ ] Docs snippet authors can copy
- [ ] Tests: no file, valid file, invalid file, merge de-dupe

## Depends on

- E03-S01
- E07-S02 for a second boot target (Storybook)

## Open questions

- Filename and location (`scryglass.yml` vs `.scryglass/review.yml`)
- Do we support Chromatic later as an optional plugin only?
