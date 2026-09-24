# How layers are determined

Folder names are a hint, not a source of truth. Consultancy repos will not all have `src/api/`. A file in `helpers/invoices.ts` can still be an API module. Jev does not assign layers.

Layer is **where the file sits on a spine we can point to in the repo**:

```text
routes  →  page  →  store / composable  →  api  →  http
              ↘  component ↗
```

We find the two **anchors**, then assign everything else by **edges**.

## 1. Anchors (facts, not names)

These are the only places we accept a convention or a parser:

| Anchor | How we know (deterministic) | Adapter |
| --- | --- | --- |
| **Test** | Filename: `.test.` / `.spec.` / `_test.` | generic |
| **Routes** | File exports a route table, **or** calls `createRouter` / `createBrowserRouter`, **or** Next/Nuxt file-route convention (`app/**/page.tsx`, `pages/**`, `+page.vue`) | generic + Vue/Next |
| **Page** | Listed as a route target in that table, **or** *is* the file-route file | same |
| **HTTP** | Shared transport: exports `get`/`post`/… or wraps `fetch`/`axios`, **and** is imported by at least one module that is **not** a page | generic |
| **Store** (when the framework says so) | `defineStore`, `createSlice`, `create` (zustand), Vuex `createStore` | Vue/React adapter |

If an adapter cannot see a router, we have no pages. That is a missing fact, not a guess. The file graph still works.

## 2. Position (walk the DAG)

Once anchors exist, the rest is import direction. No LLM. No folder required.

| Layer | Rule |
| --- | --- |
| **api** | Imports `http` (or another `api`), **and** is imported by something that is not only a single page/component (a store, another api, or ≥2 pages) |
| **store** | Imports `api` (or is a framework store), **and** is imported by a `page` |
| **composable / hook** | Imports `store` or `api`, imported by a `page`, not itself a store |
| **component** | Imported by a `page` or another `component`. **May import http.** That is `ui.network`, not a layer change. |
| **shared** | Used by `store` or `api`, but is not itself transport (session helpers, mappers) |
| **app** | Imports the route table (entrypoint) |
| **other** | No rule matched. Stay `other`. Do not invent `api` |

Every assignment stores `why`: `"imports src/api/httpClient.ts (http) and is imported by useCustomerStore.ts"`.

If path is `src/helpers/foo.ts` and the rule says `api`, the layer is `api`. The path may be shown as extra context. It does not win.

## 3. Calling `fetch` is a flag, not a layer

**Page** is only "this file is a route target." A heading never becomes a page because it fetches.

A `SettingsHeading` that imports `httpClient` or calls `fetch`:

| Wrong | Right |
| --- | --- |
| layer = page | layer = **component** (a page imports it; it is not in the router) |
| layer = http | http is a **shared client** (non-page importers) |
| layer = api | api is used as data for a store or for **several** pages |

It gets `ui.network` ("this UI talks to the network"). That is an attention flag. It does not climb the spine.

A page-local data helper used by one screen is the same: component + `ui.network`, not a shared API. Extract it and use it from a store or a second page if it should be `api`.

## 4. Surfaces are not layers

`auth`, `billing`, `permissions` are **surface flags** (`surface.auth`), not layers.

A session helper is often `layer.shared` + `surface.auth`. Forcing `layer.auth` because the folder is `auth/` is the folder trap again. The raise still happens: `surface.auth` + `reach.wide` → spine.

Surface rules (conservative, recorded as heuristic):

- path or export name matches a small closed list (`auth`, `session`, `token`, `permission`, `billing`, `invoice`, `payment`)
- **or** the file imports a known library (`next-auth`, `passport`, …)

If neither matches, no surface flag. We do not ask Jev "does this look like auth?"

## 5. What we will not do

- Jev assigns `layer.*`
- `fetch` / `axios` in a file ⇒ page, http, or api
- `src/api/**` ⇒ api with no graph check (path may *confirm* a graph assignment, never create one alone in production)
- "The filename says Service so it is an API"
- Treating Electron `main` vs `renderer` as a guess — those are entrypoint anchors from the adapter

## 6. Disagreement

If a path heuristic (dev-only, or a repo-local override) disagrees with the graph, **graph wins**, and we record both:

```text
layer=api
why=imports httpClient; imported by useCustomerStore
pathHint=src/helpers/invoices.ts (would have been "other" by folder)
```

Repo-local overrides (`scryglass.yml` `layers:`) are allowed as an escape hatch when the graph is wrong. They are explicit, not inferred.

## 7. Fixture

`fixtures/blast-radius.mjs` now classifies loom-shop with this walk. Folders still happen to match, but the classifier does not read `src/api/` to decide `api`.

PR-07 is the proof for §3: `FetchingHeading.ts` imports `httpClient` and calls `fetch`, stays `component`, and gets `ui.network`.

See E02-S08.
