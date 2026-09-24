# E03-S03 — Compare base and PR

**Epic:** E03 The Living Mirror  
**MVP:** Yes  
**Status:** Draft

## Outcome

The reviewer can see the same route/state on **base**, **PR**, and a **visual diff**, then jump to the live PR. This is to understand what the feature changed, not to fail a CI gate. Viewport, browser, and (as far as we can) data stay fixed.

## Scope

### In

```text
BASE → render → screenshot
PR   → render → screenshot
BASE ↔ PR → visual diff
```

- Boot base checkout or a second worktree
- Pixel or perceptual diff without a paid service
- UI affordance: BASE | PR | DIFF (consumed by E05)
- Open live PR URL

### Out

- Flake scoring as a CI gate
- Commercial visual-testing SaaS
- Auto-failing the PR because pixels moved

## Acceptance criteria

- [ ] Same target captured on base and head SHAs
- [ ] A known pixel change produces a diff image
- [ ] An identical page produces no (or negligible) diff
- [ ] Missing base capture is shown as "base unavailable", not as a visual change
- [ ] Comparison metadata lists viewport, browser, SHAs

## Tasks

- [ ] Worktree or second checkout strategy for base
- [ ] Reuse S02 capture against base
- [ ] Choose a local differ (Playwright screenshots, pixelmatch, odiff)
- [ ] Store `{ base, pr, diff, mismatchPercent }`
- [ ] Document flake sources (time, data, animations)
- [ ] Tests with a fixture that changes a color / label

## Depends on

- E03-S02
- E07-S02 (boot both sides)

## Open questions

- Worktree vs stash vs two ports — which is least painful for the first repo?
- Animations / clocks: disable CSS animations in MVP?
- Auth cookies: copy from PR session to base, or only public routes?
