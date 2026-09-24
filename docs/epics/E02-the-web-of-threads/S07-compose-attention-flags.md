# E02-S07 — Compose attention flags

**Epic:** E02 The Web of Threads  
**MVP:** Yes  
**Status:** Draft

## Outcome

Job 2 is a **bundle of named flags**, not a consumer count. Blast radius is one family. Layer, contract, tests, change shape, and sensitive surfaces are computed too. Rank is a visible rule over the bundle. See [attention-flags.md](../../../attention-flags.md).

## Scope

### In

- Emit `{ id, severity, why[] }` per changed file and per PR
- MVP families: reach, layer, `ui.network`, contract.exports, test.gap/present, change.cross-layer / spine-and-ui, surface.auth/billing, noise.isolated-page
- Derive spine/high/medium/low from the published rule (not from LOC)
- Show flags in fixture output and later in the High Seat

### Out

- Jev-invented flags (those are `jev.*` in E04)
- History/complexity until git + lizard are wired
- A single opaque "attention score" with no flag list

## Acceptance criteria

- [ ] `customerApi` carries `layer.api`, `reach.wide`, `reach.multi-route`, `test.present` — not only a consumer number
- [ ] `SettingsHeading` carries `layer.ui-leaf` / `noise.isolated-page`, not `reach.wide`
- [ ] `FetchingHeading` carries `ui.network` and stays `layer=component` / risk **low** — not `layer.http` / `layer.api`
- [ ] A billing/API file with no spec carries `test.gap`
- [ ] An `auth/` or `session` path carries `surface.auth`
- [ ] Mixed UI+API PR carries `change.spine-and-ui`
- [ ] Rank still puts the API above the heading
- [ ] `node fixtures/blast-radius.mjs --check` stays green

## Tasks

- [ ] Implement the MVP flag table in the session model
- [ ] Keep `fixtures/blast-radius.mjs` as the executable spec
- [ ] Map blast-radius-cli JSON → reach flags; do not treat their `risk_tier` as our only flag
- [ ] Leave stubs for `contract.export-removed`, `history.hotspot`, `complexity.up`
- [ ] High Seat: render flags as chips with `why` on hover (E05)

## Depends on

- E02-S02, S03, S04, S05
- [attention-flags.md](../../../attention-flags.md)

## Open questions

- Thresholds for `reach.wide` on a 3k-file consultancy repo (5 is the fixture number)
- Whether `test.gap` should raise on leaf UI (proposal: no, only api/store/http/page)
