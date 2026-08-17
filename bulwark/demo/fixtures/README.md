# Bulwark demo fixtures

Layouts for detector A/B and seed-recall scoring. Metadata (expected leaf inventory +
seeded failures) lives next to each fixture so knobs are not tuned to a single screen.

## Catalog (18)

### Layout shells

| id | Device | Viewport | Color seeds | Notes |
|---|---|---|---|---|
| `landing` | desktop | 800×600 | button | sparse CTA card |
| `workspace` | desktop | 800×600 | primary-color | dense app shell |
| `admin` | desktop | 960×640 | new-color | sidebar + table |
| `settings` | desktop | 800×600 | save-color | form |
| `mobile-feed` | mobile | 390×844 | accent | phone feed |

### Color-stress / marketing

| id | Device | Viewport | Color seeds | Stress |
|---|---|---|---|---|
| `brand-hero` | desktop | 800×600 | 4 | saturated marketing |
| `pricing` | desktop | 960×640 | 4 | multi-accent tiers |
| `dashboard-vivid` | desktop | 960×640 | 4 | loud KPI tiles |
| `promo-mobile` | mobile | 390×844 | 4 | neon light-on-dark |

### Category surfaces

| id | Device | Viewport | Color seeds | Stress |
|---|---|---|---|---|
| `eshop` | desktop | 960×640 | 5 | retail PDP (ATC, sale, stars, swatch) |
| `marketplace` | desktop | 960×640 | 4 | listing grid badges + prices |
| `food-delivery` | mobile | 390×844 | 4 | chips, promo tags, cart bar |
| `booking` | desktop | 800×600 | 4 | calendar day fill + Reserve |
| `fintech` | desktop | 800×600 | 4 | green/red money ink on dark |
| `docs` | desktop | 800×600 | 4 | nav/link ink + code fill |
| `portfolio` | desktop | 800×600 | 4 | near-black quiet chrome |

### Analytical dashboards

| id | Device | Viewport | Color seeds | Stress |
|---|---|---|---|---|
| `analytics-web` | desktop | 1120×720 | 5 | pie + bars + line + legend swatches |
| `analytics-mobile` | mobile | 390×844 | 5 | donut + rank bars + sparkline |

Legacy aliases: `/correct`→landing, `/complex`→workspace.

Each fixture directory under `demo/fixtures/<id>/` contains:

- `manifest.json` — expected leaves, seed defects, viewport, detection notes
- `design/figma-screenshot.png` — captured correct layout
- `bulwark.screenparser.config.json` — Compose preset
- `bulwark.local.config.json` — localhost CLI

## Capture design PNGs

```sh
pnpm install
pnpm --filter @bulwark/adapters exec playwright install chromium
node demo/scripts/capture-fixture-designs.mjs
# subset:
node demo/scripts/capture-fixture-designs.mjs analytics-web analytics-mobile
```

## Run a fixture

```sh
pnpm --filter @bulwark/demo-target serve
curl -s http://localhost:4173/fixtures | jq

curl -X POST http://localhost:4190/api/runs \
  -H 'content-type: application/json' \
  -d '{"config":"analytics-web-screenparser","label":"Analytics web · ScreenParser"}'
```

Presets: `<id>-screenparser` for every catalog id.

## Scoring

Compare raw `/v1/detect` box count to `manifest.expectedLeafCount`, and check that
seeded broken routes still surface the `expectedDefectTypes` listed per seed — not
raw `totalDefects`.

For the **color gate**, use seed↔defect hex matching (descriptions like
`#live instead of #design`). Accepted baseline, architecture notes, and future
work: [docs/color-gate.md](../../docs/color-gate.md).

## Typography fonts

Each fixture declares calibrated faces in its Bulwark configs (see
[`font-kits.json`](./font-kits.json)). Refresh after kit changes:

```sh
node demo/scripts/apply-fixture-font-kits.mjs
node demo/scripts/calibrate-font-profiles.mjs --write-configs
node demo/scripts/capture-fixture-designs.mjs
```

Notes: [docs/typography.md](../../docs/typography.md).
