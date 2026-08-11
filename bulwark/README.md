# Bulwark

Deterministic, non-generative visual design QA. Bulwark compares a Figma export
screenshot to a live browser implementation and reports measurable defects —
spacing, position, typography, and color — without pixelmatch or LLMs.

## What you get

- **Overlay dashboard** — opacity, curtain/`clip-path` split, and
  `mix-blend-mode: difference` so a human can confirm what the engine found
- **Automated OmniDiff pipeline** — OmniParser boxes, spacing math (±2px),
  font size via cap-height ratios, weight via ink density, optional family via
  SSIM, colors via seeded k-means + ΔE2000
- **Docker Compose stack** — heuristic OmniParser + PaddleOCR services, API,
  dashboard, and a demo target with seeded defects

## Layout

```text
bulwark/
  packages/
    domain/      # Pure geometry, matching, spacing, typography, color, report
    imaging/     # PNG, ink masks, projection, k-means, SSIM
    ports/       # Detector / OCR / inspector / rasterizer / clock / store
    adapters/    # HTTP vision, Playwright, filesystem, fakes, scene builder
    pipeline/    # Config, QaEngine, QaRunner, service wiring
  apps/
    cli/         # run, capture, analyze, doctor, init, serve
    api/         # REST for runs / reports / artifacts
    dashboard/   # React overlay workbench
    demo-target/ # Static page with seeded defects
  services/
    omniparser/  # FastAPI detector (:8801)
    paddleocr/   # FastAPI OCR (:8802)
  demo/          # Design PNG + bulwark.config.json
```

## Quick start (local)

Requires Node 20+, pnpm 10.

```sh
cd bulwark
pnpm install
pnpm run build
pnpm test
```

Generate the demo design export (already checked in under `demo/design/`):

```sh
node demo/scripts/generate-design.mjs
```

Complex sample (nav + sidebar + cards + table) and a local OmniParser YOLO setup:

```sh
node demo/scripts/capture-complex-design.mjs
./scripts/setup-omniparser-local.sh
```

See [demo/README.md](demo/README.md) for `/complex-broken` and host-detector Compose wiring.

Run the demo target:

```sh
pnpm --filter @bulwark/demo-target serve
# http://localhost:4173/correct  — matches the design
# http://localhost:4173/broken   — seeded defects
# http://localhost:4173/complex  — denser layout
# http://localhost:4173/complex-broken
```

Point `demo/bulwark.config.json` at localhost (or keep Docker hostnames and use
Compose below), then:

```sh
pnpm bulwark -- run -c demo/bulwark.config.json
pnpm bulwark -- serve .artifacts/<run-id>
```

## Docker Compose

From `bulwark/`:

```sh
docker compose up --build
```

| Service     | Port | Role                                      |
| ----------- | ---- | ----------------------------------------- |
| dashboard   | 8080 | Overlay UI + `/api` proxy + `/artifacts`  |
| api         | 4190 | `POST /api/runs`, report/artifact serving |
| demo-target | 4173 | Complex workspace sample (`/complex-broken`) |
| omniparser  | 8801 | OmniParser YOLO + Florence captions (CPU) |
| paddleocr   | 8802 | PaddleOCR CPU text recognition            |

The OmniParser image downloads Microsoft's `icon_detect` weights at build time and
serves Bulwark's `/v1/detect` contract. First build is large (PyTorch) and slow.

Kick off a run:

```sh
curl -X POST http://localhost:4190/api/runs -H 'content-type: application/json' -d '{}'
```

Then open <http://localhost:8080/> — nginx serves the latest run from
`/artifacts/` (the API maintains an `artifacts/latest` symlink after each run).

## CLI

```sh
pnpm bulwark -- init
pnpm bulwark -- doctor -c bulwark.config.json
pnpm bulwark -- capture -c bulwark.config.json
pnpm bulwark -- analyze -c bulwark.config.json
pnpm bulwark -- run -c bulwark.config.json
pnpm bulwark -- serve .artifacts/<run-id>
```

## API

| Method | Path                                | Description       |
| ------ | ----------------------------------- | ----------------- |
| GET    | `/api/health`                       | Liveness          |
| GET    | `/api/runs`                         | List prior runs   |
| POST   | `/api/runs`                         | Capture + analyze |
| GET    | `/api/runs/:id`                     | Run metadata      |
| GET    | `/api/runs/:id/report`              | `report.json`     |
| GET    | `/api/runs/:id/artifacts/:file.png` | PNG artifact      |

Env:

- `BULWARK_CONFIG` — path to config (default `bulwark.config.json`)
- `BULWARK_ARTIFACTS_DIR` — overrides `output.artifactsDir`
- `BULWARK_DASHBOARD_ORIGINS` — comma-separated CORS allowlist
- `PORT` — default `4190`

## Determinism

Production code must not call `Math.random()` or wall-clock `Date` /
`Date.now()`. ESLint enforces this. Clocks and seeded PRNGs are injected;
reports are written as canonical JSON.

## Docs

- [Architecture](docs/ARCHITECTURE.md)
- [Demo](demo/README.md)
- [Vision services](services/README.md)

## Verify

```sh
pnpm run verify   # format + lint + typecheck + test
```
