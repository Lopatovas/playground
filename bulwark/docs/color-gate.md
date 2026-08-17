# Color quality gate

Status: **accepted for v1 color**. Seed-scored on the 18-fixture suite (64 color
seeds). Target was ~90% F1; landed ~97% F1 on the honest metric.

## Scorecard (accepted baseline)

Metric = **seed ↔ defect hex matching** (not defect-count proxies).

| Stage | Seed recall | Precision | F1 | Notes |
|---|---:|---:|---:|---|
| Early specialized / Otsu ink | ~58% | ~81% | ~68% | 16 fixtures |
| Border-BG ink + solid regions | ~74% | ~77% | ~76% | |
| + chart palette | ~84% | ~70% | ~77% | pie/donut hit; FP clones |
| + dedupe / SolidFill↔Button | ~86% | ~98% | ~92% | |
| + soft ΔE + glyph solids + chromatic Text→fill | **95.3% (61/64)** | **98.4% (60/61)** | **96.8%** | **accepted** |

**Caveats (intentional):**

- One defect can satisfy multiple seeds that share the same planted CSS hex pair
  (e.g. analytics teal).
- Identical `(role, expectedHex, actualHex)` reports are deduped before the agent
  sees them.
- This is the **color gate only** — spacing / structure / typography are separate.

**Remaining misses (3):** `range-ink`, analytics-mobile `link-ink`, dashboard-vivid
`value-ink`. One occasional FP on `mobile-feed` body text.

Artifacts from the accepted run live under each fixture’s `.artifacts/` and the
summary dump `/tmp/color-suite-chroma-text.json` (local).

## What the color path does now

Specialized strategies (not one k-means path for every box):

| Strategy | When | What it compares |
|---|---|---|
| `fill` | Solid buttons, badges, chips, solid Images, chromatic solid `Text` | Dominant background ΔE (default threshold **4**) |
| `ink` | Headings, links, tabs, body `Text` on paper | Border-BG + farthest-mode ink; chromatic ΔE **5**, neutral **13** |
| `palette` | `Chart` + mid-solidity Images | Chromatic series stops, greedy match, series ΔE **8** |
| `skip` | Photos, chrome, weak fills | Nothing |

Supporting pieces:

- **Solid-region proposals** after ScreenParser — glyph-aware purity, prefer
  saturated solids over washed siblings, SolidFill↔Button matching.
- **Ink stability gates** — polarity, luminance, paper ΔE, share mismatch
  (looser for high-chroma accents).
- **Pale-button fill+ink** — light wash + colored label (e.g. free-delivery tag).
- **Dedupe** — collapse clone shade reports for agent UX.

Key code:

- `packages/pipeline/src/measure/color-strategy.ts`
- `packages/pipeline/src/measure/color-measurer.ts`
- `packages/domain/src/checks/color-check.ts`
- `packages/imaging/src/ink-mask.ts`
- `packages/imaging/src/chart-palette.ts`
- `packages/imaging/src/solid-regions.ts`

## How this differs from early color v1

| | Early | Accepted |
|---|---|---|
| Routing | One cluster/CSS path | fill / ink / palette / skip |
| Ink | Grayscale Otsu → mean | Paper border + farthest-mode + tighten |
| Charts | Skip or fake single fill | Series palette |
| Undetected paint | Missed | Solid-region pass |
| Report noise | N× same hex | Dedupe |
| Trust metric | Defect counts | Seed↔hex F1 |

## Future improvements (not blocking)

Ordered by likely leverage; none required to ship the current color gate.

1. **Unstable link ink (option 3)** — for `Link` labels, if raster ink fails the
   stability gate but a DOM node exists, compare design raster ink to live
   `getComputedStyle().color`. Targets `range-ink` / analytics `link-ink`.
2. **`value-ink` / soft KPI text** — tighten crops or chroma-gated share further
   for small accent numerals on busy cards.
3. **Kill the last mobile-feed FP** — demote near-neutral body `Text` slightly, or
   raise neutral ink floor only for unlabeled body copy.
4. **Config surface** — expose `seriesDeltaE`, `solidTextMinChroma`,
   `minPaletteShare` in docs/presets so hosts can tune without code.
5. **Live DOM boxes for color pairing** — vision on design, DOM rects on live,
   fewer fat-vs-tight ink skips (broader than color, helps ink most).
6. **Leave OCR out of the hot path** — still a last resort for inventory, not for
   color measurement.

## Re-scoring the suite

```bash
# Local CLI against demo-target :4173 + ScreenParser :8804
# (see each fixture’s bulwark.local.config.json)
cd bulwark/demo/fixtures/<id>
node ../../../apps/cli/dist/bin.js run -c ./bulwark.local.config.json
```

Score with seed descriptions of the form `#live instead of #design` matched to
defect `actualHex` / `expectedHex` (channel tolerance ~18). Prefer
**non-exclusive** seed hits when several seeds share one planted hex.
