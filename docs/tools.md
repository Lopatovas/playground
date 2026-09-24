# What we can absorb

Open-source first. We do not rebuild a graph engine, a diff viewer, or a browser if a good MIT/Apache tool already does the job. We still own the cockpit, the three jobs, and the Bitbucket comment path.

Researched against [loom-shop](../fixtures/README.md). **Deterministic except Jev** still applies: absorb parsers and UIs, not AI reviewers.

## Verdict (start here)

| Need | Absorb | Why |
| --- | --- | --- |
| Blast radius / risk (job 2) | **[blast-radius-cli](https://github.com/ehermanson/blast-radius)** first | Already answers "how far does this change reach?" with JSON, export-level graphs, Vue `<script>` imports, `git diff --name-only \| blast-radius files -`. Ran on loom-shop: shared API = 7 files / `moderate`; settings heading = 3 files / `minor`; large isolated page = 2 files / `minor`. |
| Vue SFC + mature fallback | **[dependency-cruiser](https://github.com/sverweij/dependency-cruiser)** | `--affected <base>` is literally PR impact. Real Vue 2/3 SFC support via `@vue/compiler-sfc`. Use when blast-radius misses template-only components or we need a widely adopted engine. |
| Template component refs | **`@vue/compiler-sfc`** | Fill the known hole: Vue/Svelte tools often miss components used only in `<template>`. |
| Changed symbols | **ts-morph** / TS compiler API | Compiler-grade names and references. Heavier; use after the file graph exists. |
| See the feature (job 1) | **Playwright** + **odiff** | Capture stills; compare BASE/PR locally. No Chromatic/Percy/Lost Pixel Cloud. |
| Diff pane (job 3) | **`@pierre/diffs`** or Monaco `DiffEditor` | Do not write a hunk renderer. Pierre has annotation hooks for drafts. |
| Impact map UI | **React Flow** (`@xyflow/react`) or **Cytoscape.js** | Clickable graph, not Mermaid-as-the-product. |
| Git facts | **git CLI** (or `simple-git`) | Boring and correct. |
| Bitbucket PR + comments | **Bitbucket REST** (PR comments, not commit comments) | Thin adapter. Do not adopt Gerrit/Review Board as the product. |

## Job 2 — graph and risk

### Absorb: blast-radius (MIT, Rust, npm `blast-radius-cli`)

This is the closest existing tool to Scryglass job 2. Verified on the fixture (2026-09-24, v0.8.0):

```text
customerApi.ts        7 files   risk_tier=moderate   (matches our spine)
SettingsHeading.ts    3 files   risk_tier=minor
MarketingLandingPage  2 files   risk_tier=minor
mixed PR              API 7 files > page 3 files
```

Use:

```bash
npx blast-radius-cli --repo-root fixtures/loom-shop --format json \
  file src/api/customerApi.ts
npx blast-radius-cli --repo-root fixtures/loom-shop --format tree \
  files src/api/customerApi.ts src/pages/CustomerPage.ts
```

**Take:** file + export blast radius, JSON graph, risk tier, endpoint leaves (pages/routes), confidence, Vue/Svelte script imports, monorepo/alias resolution.

**Do not take as-is:** their `minor/moderate/risky/high` labels as our product language. We still add **layer** (api / store / page / heading) so a shared API is a *spine*, not merely "moderate." Their GitHub Action that *comments risk on the PR* is not our comment UX (we publish *human* comments).

**Risk:** young project (2026, small community). Wrap behind `HostGraph`/`ImpactEngine`. If it stalls, swap the engine to dependency-cruiser without rewriting the High Seat.

### Absorb: dependency-cruiser (MIT, mature)

`--affected <baseSha>` + JSON/mermaid reporters. Vue SFCs when the Vue compiler is installed. Good fallback and good for "modules this PR touches." Needs a config (`depcruise --init`). Zero-config on loom-shop did not emit modules — expect to generate config per repo or pass `--no-config` plus TS settings on real apps.

### Maybe later

| Tool | Use if |
| --- | --- |
| **skott** | We want a JS graph API (`collectFilesDependingOn`). No first-class Vue SFC yet. |
| **ts-morph** | Symbol-level consumers beyond file reach. |
| **Nx `affected`** | The dogfood repo is already an Nx workspace. |
| **madge / knip** | Cycles / unused exports. Not PR risk. |

### Skip as the engine

- **impact-graph, Diff-Guard, minh-gkg** — similar ideas, weaker fit or less proven than blast-radius + depcruise.
- **Our `fixtures/blast-radius.mjs`** — keep as a golden harness and teaching model, not the production engine.

## Job 1 — Living Mirror

| Tool | Decision |
| --- | --- |
| **Playwright** | Absorb. Boot, screenshot, traces later. |
| **odiff** / **playwright-odiff** | Absorb for BASE↔PR stills. Faster/stabler than stock pixelmatch. |
| **Lost Pixel (OSS)** | Optional later for Storybook shot sets. Do not take the hosted platform. |
| **Loki, Backstop, Chromatic, Percy, Happo** | Skip as core. Commercial or Storybook-only. |

## Job 3 — review UX

| Tool | Decision |
| --- | --- |
| **`@pierre/diffs`** | Strong absorb for the center-stage diff + comment anchors. |
| **Monaco DiffEditor** | Fine alternative if Pierre is too opinionated. |
| **React Flow / Cytoscape** | Absorb for the change map. |
| **skepsis** | Steal UX ideas (local diff, keyboard). Do not adopt "comments written into source files." |
| **Gerrit, Review Board, Phorge, Codeveira, git-appraise** | Skip. They *replace* the host. We *publish to Bitbucket*. |
| **danger.js / review bots** | Skip. They write robot comments. We write the reviewer's. |

Bitbucket: use the **pull request comments** API (`inline.path` + `to` for the new file). Never the commit-comments API.

## What we still build

Absorbing those tools does **not** replace Scryglass. We still build:

1. Session + Bitbucket open/checkout (E01, E07)
2. Layer tags + key-point ranking on top of whatever engine (E02-S05)
3. High Seat that links map ↔ diff ↔ preview ↔ comment (E05)
4. Drafts and batch publish to the PR (E08)
5. Optional Jev marks on structured payloads (E04)
6. Playwright orchestration for "what is the feature?" (E03)

## Spike order (fastest path)

1. Wrap `blast-radius-cli` on loom-shop; map JSON → our `AttentionMap` / risk + key points. Keep `fixtures/blast-radius.mjs --check` as the contract.
2. Add `@vue/compiler-sfc` (or depcruise) only when a Vue dogfood PR loses template edges.
3. High Seat: `@pierre/diffs` + React Flow over that JSON.
4. Playwright + odiff for one fixture route when we have something that boots.
5. Bitbucket adapter last among the floors (needs their instance).
