# Attention flags

Blast radius answers **how far**. It does not answer **what kind of far**, **whether the contract moved**, **whether tests exist**, **whether this file is a hotspot**, or **whether the PR crossed a boundary**.

Attention in Scryglass is a **bundle of deterministic flags**. Each flag is a named fact plus a why. Rank is derived from the bundle. Jev may later re-weight the same bundle. It may not invent flags.

```text
facts (computed)     →  flags (named)     →  rank / key points
imports, git, AST        reach.wide            spine / high / …
layer, tests, diff       test.gap
                         contract.export-removed
                         surface.auth
```

## Rules

- Every flag has an `id`, `severity` (`raise` | `info` | `demote`), and `why[]` of facts.
- LOC may appear in `why` as a fact. It must not set severity.
- Missing data → no flag. Do not guess.
- The High Seat shows flags, not a single mystery score.
- Jev input **is** this bundle (see E04-S01). No extra prose.

## Flag catalog

MVP = we can compute it on loom-shop or with git/AST we already planned. Later = absorb a tool or need a real repo history.

### Reach (blast radius — necessary, not sufficient)

| ID | Raise when | Source | MVP |
| --- | --- | --- | --- |
| `reach.wide` | Many direct+transitive consumers | blast-radius-cli / our graph | Yes |
| `reach.multi-route` | ≥2 routes in the consumer cone | routes table | Yes |
| `reach.user-facing` | Hits a page / endpoint leaf | blast-radius `◎ endpoint` | Yes |
| `reach.cross-package` | Consumers span packages | blast-radius `packages` | Later (monorepo) |

### Layer (what kind of code)

| ID | Raise when | Source | MVP |
| --- | --- | --- | --- |
| `layer.http` | HTTP client / transport | DAG: no local imports + fetch/get/post | Yes |
| `layer.api` | Shared API / service | DAG: imports http, has app importers | Yes |
| `layer.store` | State module | DAG: imports api, imported by a page (or `defineStore`) | Yes |
| `layer.data-flow` | API, store, http, or shared helper | derived | Yes |
| `layer.ui-leaf` | Component/page, one route | DAG | Yes |
| `layer.routes` | Router table | exports `{ path, page }` / createRouter | Yes |

Layer method: [layer-detection.md](./layer-detection.md). Folder names do not assign these.

### Contract (did the public shape move?)

| ID | Raise when | Source | MVP |
| --- | --- | --- | --- |
| `contract.exports` | File is an API/store and has exports (look here) | AST | Yes (presence) |
| `contract.export-removed` | Named export disappeared vs base | ts-morph + git | After we have base |
| `contract.export-signature` | Export params/types changed | ts-morph | After we have base |
| `contract.http-path` | String route in an API module changed | AST + diff | After we have base |
| `contract.route-table` | Vue Router / Next route added/removed | adapter | With E02-S03 |

### Tests

| ID | Raise when | Source | MVP |
| --- | --- | --- | --- |
| `test.gap` | No colocated spec and no test in the consumer cone | graph + name convention | Yes |
| `test.present` | Related test exists (info) | same | Yes |
| `test.deleted` | A test file was deleted in the PR | git status | After real diffs |

### Change shape (the PR as a whole)

| ID | Raise when | Source | MVP |
| --- | --- | --- | --- |
| `change.cross-layer` | Changed files span ≥2 layers | layers | Yes |
| `change.spine-and-ui` | Spine (api/store/http) **and** page/component | layers | Yes |
| `change.scattered` | Many unrelated folders, no shared spine | paths | Later |

### History (needs git log — skip on the fixture)

| ID | Raise when | Source | MVP |
| --- | --- | --- | --- |
| `history.hotspot` | File is high-churn | `git log --follow --count` or Code Maat | After real repos |
| `history.legacy-touch` | Rarely touched file now changes | git age | After real repos |
| `history.unusual-cochange` | Files in this PR do not usually change together | Code Maat coupling | Later |

### Surface / sensitivity (path + name, conservative)

| ID | Raise when | Source | MVP |
| --- | --- | --- | --- |
| `surface.auth` | Path/name matches auth, session, token, permission | regex on path | Yes |
| `surface.billing` | billing, payment, invoice, payout | regex on path | Yes |
| `surface.config` | env, ci, webpack, vite config | path | Later |

### Hygiene (diff facts, not style opinions)

| ID | Raise when | Source | MVP |
| --- | --- | --- | --- |
| `hygiene.ts-suppression` | Added `@ts-ignore` / `@ts-expect-error` | diff | After real diffs |
| `hygiene.eslint-disable` | Added eslint-disable | diff | After real diffs |
| `complexity.up` | Cyclomatic complexity rose | [lizard](https://github.com/terryyin/lizard) on base vs head | Later |

### Demote (keep visible, do not lead)

| ID | Demote when | Source | MVP |
| --- | --- | --- | --- |
| `noise.isolated-page` | Page, one route, small cone | graph | Yes |
| `noise.lockfile` | lockfile / generated | path | Yes |
| `noise.comment-only` | Diff is comments/whitespace | git | After real diffs |

## How rank is derived (MVP)

Do **not** average flags into a mystery number. Use a visible rule:

1. If any `layer.http` / `layer.api` / `surface.*` **and** (`reach.wide` or `reach.multi-route`) → **spine**
2. Else if `layer.data-flow` or `contract.export-*` or (`test.gap` and `layer.api`) → **high**
3. Else if `reach.wide` or `change.spine-and-ui` → **medium**
4. Else if only `noise.*` / `layer.ui-leaf` → **low**
5. LOC never enters this table

Key points = changed files sorted by that rank, then by raise-flag count, then by consumer count.

## What Jev is allowed to do

Jev sees the same flag bundle (plus optional tiny snippet). It may add *probabilistic* flags such as `jev.business-logic` or `jev.unusual`. Those must be prefixed `jev.` and shown as signals.

It may not emit `reach.*`, `layer.*`, `test.*`, or `contract.*`. Those are computed.

## Absorb (do not rebuild)

| Flag family | Tool |
| --- | --- |
| Reach, endpoints, confidence | `blast-radius-cli` |
| Vue SFC edges | dependency-cruiser, `@vue/compiler-sfc` |
| Export / signature | ts-morph |
| Complexity delta | lizard |
| Churn / coupling | git log; Code Maat if we want CSV coupling |
| Dead exports | knip / fallow (optional, not MVP) |

See [tools.md](./tools.md).

## Fixture

`node fixtures/blast-radius.mjs` now prints flags per sample PR. If a heading has `reach.wide` and a shared API does not, the catalog is wrong.
