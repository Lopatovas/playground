# Bulwark — R&D status

**What it is.** Deterministic visual QA: design PNG vs Playwright live page. Matches elements and reports position, spacing, color, typography, missing/unexpected.

**Goal.** AI implements a design → Bulwark reports what’s off → AI fixes. Feedback must be precise enough for an agent to trust — especially font-size. Must work from any design tool via PNG (no Figma-only core).

**Where we are.** Parked. PNG-only gets high soft recall on planted fixture seeds, but soft precision is too low for a safe agent loop. Color is the strongest gate. If revived: tool-neutral design snapshot (richer boxes/styles), not more PNG heuristics.

## Last scorecard

18 ScreenParser fixtures · ink-projection · size-fit off · page text boxes off · font-size tol ±3px · weight gap 300 · ratio ×0.92

| | |
|---|---|
| Median runtime | ~6.2s / fixture |
| Defects | ~13 / fixture · 239 suite-wide |

| Gate | Soft recall | Soft precision |
|---|---|---|
| Typography (all) | 8/8 (100%) | ~24% (8/33) |
| → font-size | 6/6 | ~23% (6/26) |
| → font-weight | 1/1 | 20% (1/5) |
| → font-family | 1/1 | 50% (1/2) |
| Color | 64/64 (100%) | — |
| Position | 12/12 (100%) | ~20% (12/61) |

Soft recall = planted seeds hit. Soft precision = seed hits ÷ defects of that kind.

**Parked experiments (defaults off):** render-fit size sweep, full-page OCR text boxes.

## Newsletter screenshots

| File | Use |
|---|---|
| `30-newsletter-design-vs-live.png` | Hero — design vs live |
| `31-newsletter-defects.png` | Defects + score chips |
| `32-newsletter-complex.png` | Dense app shell compare |

`@2x` variants included. Regenerate via `collage.html` + `node capture-playwright.mjs` (serve this folder on :8765 first).
