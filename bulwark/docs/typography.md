# Typography gate

Status: **precision pass accepted** for v1 noise control. Fixture kits declare
faces; size/weight/family use stability gates so small ink↔CSS disagreement does
not flood the report. Planted type seeds stay at soft recall on the 18-fixture
ScreenParser suite. Render-fit size search is **parked** (opt-in only).

## Scorecard (18-fixture ScreenParser, ink÷ratio)

Metric = soft type-seed recall (fixture report contains the expected
`font-size` / `font-weight` / `font-family` kind) plus raw defect counts.

| Signal | Before precision | After precision | Ink ×0.92 | + crop/live/weight | + text-leaf boxes | Notes |
|---|---:|---:|---:|---:|---:|---|
| Planted type seeds | 100% soft | 7/8 soft | **8/8** | **8/8** | **8/8 (100%)** | Soft recall |
| Type soft precision | ~4% | ~14% | **16%** | **25%** (8/32) | **24%** (8/34) | More nodes measured |
| `font-size` defects | ~85 | **47** | **37** | **25** | **27** | Soft prec **22%** (6/27) |
| `font-weight` defects | ~111 | **10** | **10** | **5** | **5** | Gap ≥ **300** |
| `font-family` | ~20 | **2** | **2** | **2** | **2** | Soft prec **50%** |
| Avg defects / fixture | ~23 | **~15** | **~14** | **~14** | **~13** | Suite ~238 |
| Median run duration | — | **~6s** | **~6s** | **~6s** | **~6s** | Ink-only |

Color hex recall on the same run: **61/64** (unchanged from the multi-font baseline;
color re-tune remains a separate follow-up).

## Gate rules

1. **Config profiles** — size/weight use faces from `typography.profiles` / defaults.
2. **`fontSizePx` default 3** — planted size bugs are typically ≥4–10px CSS; 2–3px ink noise is ignored.
3. **Weight dead zone** — emit only when `|expected−actual| ≥ 300` (kills Δ100/Δ200 density jitter). Sign-in Georgia 700→400 still fires.
4. **Family** — SSIM mismatch among `candidateFamilies`, or **one** defect per unique **undeclared** live stack (intentional Georgia-style swaps). No per-node undeclared flood.
5. **Fixture kits** — [`demo/fixtures/font-kits.json`](../demo/fixtures/font-kits.json); pages must load `fixtures.css` (or page-class overrides in `styles.css`) so kit faces actually apply.
6. **Heading line-boxes** — shell title elements use `height: auto; line-height: 1.2` so vision↔DOM IoU survives smaller planted sizes.
7. **Detector ratio scale** — `calibrate-font-profiles.mjs` multiplies raw Playwright ink÷CSS by **0.92** so expected sizes match ScreenParser crops (unscaled left ~+1.6px mean live−expected bias).
8. **Live-face size/weight** — when the live stack is declared, size and weight use that face’s profile (SSIM is family-only).
9. **Ink crop confidence** — suppress `font-size` when ink is <6px or ink÷box fill is below **0.45** (or **0.35** for |Δ|≥6 seed-scale drops).
10. **Weight gap 300** — emit weight only when |Δweight| ≥ **300** (Δ200 density jitter suppressed; Georgia 700→400 still fires).
11. **Text-leaf boxes** — DOM association prefers text-carrying nodes for `text`/`icon`/Button chrome; typography can project that leaf onto the design box when tighter than the vision box.
12. **Page text boxes (parked)** — `typography.preferPageTextBoxes` + PaddleOCR full-page runs. 18-fixture A/B: recall **8/8**, but `font-size` **27→38**, type soft prec **24%→18%**, median ~**16s**. Off by default.

```sh
# From bulwark/
node demo/scripts/apply-fixture-font-kits.mjs
node demo/scripts/calibrate-font-profiles.mjs --write-configs
node demo/scripts/capture-fixture-designs.mjs
```

## What each check does

| Check | Source of truth |
|---|---|
| `font-size` | design ink height ÷ `visualToCssRatio` vs live `font-size` |
| `font-weight` | design stroke density → classified weight vs live `font-weight` (Δ≥200 only) |
| `font-family` | SSIM vs candidates, or undeclared-live once per stack |

## Render-fit size experiment (parked)

Code remains behind `typography.enableSizeFit` (default **false**). Family SSIM
still uses the Playwright rasterizer when enabled; size stays **ink÷ratio**.

Early shell spot-checks showed real wins on planted heading seeds (ShipFaster /
Sprint board recovered true design sizes) and fewer small-label FPs, but the
18-fixture scorecard was only modestly better (`font-size` 47→31) at large cost
(~10–15 Playwright glyph renders per text node; suite median ~15s/run). Not worth
the default path until the sweep is much cheaper or ink hits a hard ceiling.

To revisit: set `"typography": { "enableSizeFit": true }` with
`services.rasterizer.kind = "playwright"`.

## Caveats

- Ink can still miss on badly clipped detector boxes (e.g. tiny ink vs tall button
  chrome). Prefer fixing boxes / crops over raising `fontSizePx` (tol 4 kills seeds).
- Soft seed recall can pass when another `font-size` defect exists on the same
  fixture (e.g. admin title when Customers lacks DOM association). Prefer
  localized message match when auditing a single seed.
- Host onboarding / cloud font upload remains deferred.
