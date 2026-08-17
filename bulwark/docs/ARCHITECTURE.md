# Bulwark architecture

Bulwark is an OmniDiff-style visual QA engine: it turns a design raster and a
live capture into element boxes, measurements, and defect reports without
generative models or pixel-diff heuristics as the primary signal.

## Layering

```text
apps (cli, api, dashboard)
        │
        ▼
   pipeline          config → capture → detect → match → measure → report
        │
   ┌────┴────┐
   ▼         ▼
 adapters   domain     imaging (PNG / ink / SSIM / k-means)
   │
 ports       ElementDetector, TextRecognizer, LiveInspector,
             TextRasterizer, ArtifactStore, Clock, IdGenerator, Logger
```

| Package    | Responsibility                                                                                                           |
| ---------- | ------------------------------------------------------------------------------------------------------------------------ |
| `domain`   | Pure functions: boxes, mutual-nearest matching, gap graphs, font profiles, CIEDE2000, defect builders, canonical reports |
| `imaging`  | Deterministic raster ops used by adapters and pipeline measurers                                                         |
| `ports`    | Interfaces + typed errors only                                                                                           |
| `adapters` | HTTP OmniParser/PaddleOCR, Playwright inspector/rasterizer, filesystem store, fakes, synthetic scene builder             |
| `pipeline` | Zod config, service composition, `QaEngine` / `QaRunner`                                                                 |

Apps never own measurement math. The CLI and API both call `QaRunner` through
the same composition root (`buildServices`).

## Pipeline stages

1. **Load design** — PNG bytes from `design.imagePath`
2. **Capture live** — Playwright screenshot + DOM boxes (`LiveInspector`)
3. **Detect** — OmniParser (or fixture) boxes on design and live rasters
4. **Normalize** — Align coordinate spaces / pixel ratios
5. **Match** — Center-point greedy mutual nearest neighbors (default `minIou: 0` so large shifts become position defects, not missing+unexpected pairs)
6. **Measure**
   - Spacing / position: gap graph, ±`spacingPx` / `positionPx`
   - Font size: cap-height ratio (Mark Pro `0.82`, Open Sans `0.85`)
   - Weight: ink density on Otsu masks
   - Family (optional): SSIM against rasterized glyph candidates when a rasterizer is enabled
   - Color: specialized fill / ink / palette strategies + ΔE2000 (see
     [color-gate.md](./color-gate.md) for accepted scorecard and follow-ups).
     Fixture typefaces: [typography.md](./typography.md).
7. **Report** — Canonical JSON + PNG artifacts under a run directory

## Overlay dashboard

The dashboard is a human confirmation surface, not a second analyzer:

- **Opacity** — design over live
- **Curtain** — `clip-path` split scrubber
- **Difference** — `mix-blend-mode: difference`
- Defect list with filters and highlight boxes sourced from `report.json`

Artifact URLs resolve relative to the report: `/artifacts/...` when served by
`bulwark serve` / nginx, or `/api/runs/:id/artifacts/` when the report comes
from the API.

## HTTP services

Vision models sit behind ports. Docker Compose runs FastAPI services that honor
the wire contracts in `packages/adapters/src/vision/contract.ts`. The checked-in
images use deterministic heuristic fallbacks so the stack boots without model
weights; adapters also cache responses by image hash when `cacheDir` is set.

## API and artifacts

`apps/api` exposes run listing, report/artifact serving, and `POST /api/runs`.
After a successful run it writes a relative symlink `artifacts/latest → <runId>`
so nginx can mount `/artifacts/` to the newest report without the UI knowing
the id.

## Determinism rules

- No `Math.random` or wall-clock `Date` in production TypeScript (ESLint)
- Injected `Clock` and seeded PRNG for anything stochastic (k-means init)
- Canonical JSON serialization for reports
- Synthetic scene builder produces known-intent rasters for end-to-end tests

## Demo defects

`apps/demo-target` `/broken` intentionally drifts from `demo/design/figma-screenshot.png`:

- Heading `18px` vs design `24px`
- Extra CTA spacing
- Button `#3b82f6` vs `#2563eb`
