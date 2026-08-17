# Bulwark demo

This demo compares a deterministic design PNG with a tiny landing page that has seeded
visual defects.

## Paths

- Demo target app: `apps/demo-target/`
- Design generator: `demo/scripts/generate-design.mjs`
- Generated design export: `demo/design/figma-screenshot.png`
- Bulwark config: `demo/bulwark.config.json`

## Generate the design PNG

From the repository root:

```sh
node demo/scripts/generate-design.mjs
```

The script writes `demo/design/figma-screenshot.png`. It is self-contained and uses
the same 800x600 geometry as `REFERENCE_SCENE` in
`packages/pipeline/src/testing/fixtures.ts`.

## Run the target locally

```sh
pnpm --filter @bulwark/demo-target serve
```

Then open:

- Correct page: <http://localhost:4173/correct>
- Broken page: <http://localhost:4173/broken>

The `/broken` route enables these seeded defects:

- Heading font size is `18px` instead of the design's `24px`
- CTA starts lower than the design spacing
- Button background is `#3b82f6` instead of `#2563eb`

Each defect can also be toggled with query params:

```text
/correct?heading=broken&spacing=correct&button=broken
/broken?heading=correct&ctaSpacing=correct&buttonColor=correct
```

The page uses Open Sans from Google Fonts. `Mark Pro` is listed as an optional display
font fallback target, but the demo remains usable when it is not installed.

## Fixture suite (5 layouts)

See [`fixtures/README.md`](./fixtures/README.md) for the detection A/B catalog:

`landing` · `workspace` · `admin` · `settings` · `mobile-feed` ·
`brand-hero` · `pricing` · `dashboard-vivid` · `promo-mobile` · `eshop` ·
`marketplace` · `food-delivery` · `booking` · `fintech` · `docs` · `portfolio`

Each has `manifest.json` (expected leaf count, leaf list, seeded failures), design PNG,
and ScreenParser configs. Capture with:

```sh
node demo/scripts/capture-fixture-designs.mjs
```

## Complex sample (legacy alias of workspace)

A denser workspace layout lives at:

- Correct: <http://localhost:4173/complex>
- Broken: <http://localhost:4173/complex-broken>

Seeded defects on `/complex-broken`:

- Heading size `18px` vs `22px`
- Wider gaps between metric cards
- Nav link spacing drift
- Primary button `#3b82f6` vs `#2563eb`
- Table panel shifted down
- Sign in uses Georgia 16px/400 instead of Open Sans 12px/700

Capture / refresh the design export (requires Playwright from the workspace install):

```sh
pnpm install
pnpm exec playwright install chromium
node demo/scripts/capture-complex-design.mjs
```

Configs:

- `demo/complex/bulwark.config.json` — Compose network hostnames
- `demo/complex/bulwark.local.config.json` — localhost CLI
- `demo/complex/bulwark.host.config.json` — Compose API + host OmniParser YOLO

## Local OmniParser (real YOLO weights)

Docker's default OmniParser service is a heuristic stand-in. To prove detection quality
on your Mac (CPU is fine; expect 10–60s/image):

```sh
chmod +x scripts/setup-omniparser-local.sh
./scripts/setup-omniparser-local.sh
```

Then in another terminal:

```sh
source services/omniparser/.venv/bin/activate
export OMNIPARSER_WEIGHTS_DIR="$PWD/services/omniparser/weights/icon_detect"
export OMNIPARSER_DEVICE=cpu
cd services/omniparser
uvicorn app:app --host 127.0.0.1 --port 8801
```

`GET /health` should report `"weights_loaded": true`.

Point the stack at it:

```sh
docker compose -f docker-compose.yml -f docker-compose.omniparser-host.yml up -d --build
curl -X POST http://localhost:4190/api/runs -H 'content-type: application/json' -d '{}'
```

Or CLI against the complex local config while demo-target + detector run on localhost.
