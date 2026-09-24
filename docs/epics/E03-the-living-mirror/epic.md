# E03 — The Living Mirror

**Practical name:** Visual preview and base vs PR comparison  
**Status:** Draft  
**MVP:** Yes (stills + compare)

## Intent

Let the reviewer see what the feature actually is before reading 3,000 lines.

The Mirror launches the real application when it can, opens affected routes and states, and shows **BASE | PR | DIFF**. Storybook is a secondary source. Commercial visual platforms are optional, never required.

## Why this epic exists

Frontend review that never looks at the UI is incomplete. Code cannot answer "what did they build?" as fast as a rendered route.

## Outcomes

- Affected routes are discovered more than they are hand-configured
- Playwright captures stills (and later video/traces)
- Reviewer can see base, PR, visual diff, and open the live PR
- Viewports and states are first-class when data allows
- An optional manifest is a fallback, not the main path

## In scope

- Render-target discovery
- App launch + Playwright capture
- Base vs PR screenshot comparison
- Viewports and state variants
- Live interact / traces (after MVP)
- Storybook + review manifest fallbacks

## Out of scope

- Depending on Chromatic / Percy / Happo for the core loop
- Replacing visual QA as a discipline
- Declaring a visual diff a product defect automatically

## Stories

| ID | Title | MVP |
| --- | --- | --- |
| [S01](./S01-discover-render-targets.md) | Discover render targets | Yes |
| [S02](./S02-launch-and-capture.md) | Launch and capture | Yes |
| [S03](./S03-compare-base-and-pr.md) | Compare base and PR | Yes |
| [S04](./S04-viewports-and-states.md) | Viewports and states | After MVP (one viewport in MVP) |
| [S05](./S05-live-interact-and-traces.md) | Live interact and traces | After MVP |
| [S06](./S06-fallback-render-sources.md) | Storybook and review manifest | After MVP |

## Dependencies

- E02-S03 for candidate routes
- E07-S02 for booting the target app
- E07-S04 if populated/error states need fixtures

## Open questions

- Can the first target app boot twice (base + PR) without a heavy data setup?
- Auth gates — do we have a local user, a bypass, or only public routes at first?
- How close must data be for a visual diff to be meaningful?
