# Fixtures

We do not have Bitbucket or Jev access yet. These samples are the dogfood for **job 2**: deterministic blast radius, risk, and key points.

Nothing here calls a model. Re-running the script on the same PR JSON always prints the same map.

## Layout

```text
fixtures/
  loom-shop/          tiny frontend-shaped module graph
  prs/                sample PRs (changed files + title)
  expected/           golden blast-radius output
  blast-radius.mjs    import graph → consumers → risk → key points
```

`loom-shop` is not a real app. It exists so imports are obvious:

```text
routes → pages → stores / leaf UI → API → httpClient
```

- `customerApi` is a shared API abstraction (many stores, pages, routes, a test).
- `SettingsHeading` is a heading used on one page.
- `MarketingLandingPage` is a large isolated page (LOC must not become risk).

## Sample PRs

| PR | What it is | Expected risk | Key point |
| --- | --- | --- | --- |
| [PR-01](./prs/PR-01-shared-api.json) | Shared customer search API changed | **spine** (7 consumers, 2 routes) | `customerApi.ts` |
| [PR-02](./prs/PR-02-page-heading.json) | Heading on the settings page | **low** (1 route) | `SettingsHeading.ts` |
| [PR-03](./prs/PR-03-mixed-feature.json) | Search UI + the shared API | **spine** because of the API | `customerApi.ts` first, then the page |
| [PR-04](./prs/PR-04-isolated-large-page.json) | Big isolated marketing page | **low** despite more lines than the API | the page itself |
| [PR-05](./prs/PR-05-billing-api-no-test.json) | Billing API, smaller reach, no spec | **high** (`test.gap` + `surface.billing`) | `billingApi.ts` |
| [PR-06](./prs/PR-06-auth-session.json) | Session helper | **spine** (`surface.auth` + wide reach) | `session.ts` |

Flags are the point. PR-05 is the proof that **reach is not enough**: fewer consumers than `customerApi`, still raised.

## Run

```bash
node fixtures/blast-radius.mjs
node fixtures/blast-radius.mjs --pr PR-01
node fixtures/blast-radius.mjs --check

# Same ranking from the OSS engine we intend to wrap:
npx blast-radius-cli --repo-root fixtures/loom-shop --format tree \
  file src/api/customerApi.ts
```

`blast-radius-cli` (MIT) already reports customerApi as **moderate / 7 files** and SettingsHeading as **minor / 3 files**. We still add our layer tags (api spine vs one-page heading). See [docs/tools.md](../docs/tools.md).

`--check` compares output to `expected/` and exits non-zero on drift.

## What this is not

- Not Jev.
- Not a review.
- Not a visual preview (job 1 still needs Playwright later).
- Not Bitbucket comments (job 3).

It is the seed of E02: if the ranking is wrong here, the High Seat will be wrong later.
