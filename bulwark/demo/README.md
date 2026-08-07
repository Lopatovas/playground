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

## Run Bulwark

`demo/bulwark.config.json` is ready for a Docker Compose network where the app is
reachable as `demo-target` and OmniParser is reachable as `omniparser`.

### Compose (recommended)

From `bulwark/`:

```sh
docker compose up --build
curl -X POST http://localhost:4190/api/runs -H 'content-type: application/json' -d '{}'
```

Open the overlay at <http://localhost:8080/> (serves `artifacts/latest`).

### CLI on the Compose network

```sh
pnpm --filter @bulwark/cli exec bulwark run -c demo/bulwark.config.json
```

For a fully local run on the host, change:

- `target.url` to `http://localhost:4173/broken`
- `services.detector.baseUrl` to the host-published OmniParser URL, usually
  `http://localhost:8801`

The target app can be containerized with:

```sh
docker build -t bulwark-demo-target apps/demo-target
docker run --rm -p 4173:4173 bulwark-demo-target
```
