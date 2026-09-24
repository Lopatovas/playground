# E02-S08 — Detect layers from anchors and the DAG

**Epic:** E02 The Web of Threads  
**MVP:** Yes  
**Status:** Draft

## Outcome

Every file gets a layer **and a why**. Layer comes from router/HTTP/store **anchors** plus import position. Not from folder names. Not from Jev.

Method: [layer-detection.md](../../../layer-detection.md).

## Scope

### In

- Anchor: test filenames, route tables (and later Vue Router / Next file routes), HTTP transport modules
- Walk: api ← imports http; store ← imports api + imported by page; component ← used by page, no http/api
- `shared` for store/api helpers that are not transport
- Persist `layer` + `layerWhy` on the session node
- Path may be logged as a hint; graph wins
- Adapter hooks for `defineStore`, `page.tsx`, `+page.vue`

### Out

- `src/api/**` as the production rule
- `layer.auth` inferred from folder (that is `surface.auth`)
- Jev-assigned layers

## Acceptance criteria

- [ ] On loom-shop, `customerApi.ts` is `api` even if the classifier cannot see the string `src/api`
- [ ] `SettingsHeading.ts` is `component` because a page imports it and it does not import http/api
- [ ] `httpClient.ts` is `http` because it is transport with no local domain imports
- [ ] `session.ts` is `shared` (used by a store), with `surface.auth` from the name/path — not `layer.auth`
- [ ] A file with no matching rule is `other`, not guessed
- [ ] Each node has a human-readable `layerWhy`
- [ ] `node fixtures/blast-radius.mjs --check` stays green

## Tasks

- [ ] Implement the walk in the engine (fixture already prototypes it)
- [ ] Adapter: Vue `createRouter` / Pinia `defineStore`
- [ ] Adapter: Next/Nuxt file routes
- [ ] Optional `scryglass.yml` layer overrides
- [ ] Do not call Jev in this story

## Depends on

- E02-S01, S03
- E02-S06 for framework anchors

## Open questions

- How to treat PHP+Vue: PHP files stay `other` until an adapter exists; Vue files still walk
- Electron main/preload as extra anchors
