# Scryglass

Local review cockpit. It does not judge. It reveals.

```text
Foundry (Express) → engine (flags / layers) → High Seat (Vite)
        ↑
   fixture host now, Bitbucket later
```

Job 2 is computed. Jev is not called.

## Run

```bash
cd scryglass
npm install
npm run check
npm run dev
```

High Seat: http://127.0.0.1:8787

```bash
npm run cli -- open PR-01
npm run cli -- check
```

Sessions write to `SCRYGLASS_HOME` or `~/.scryglass/`. Fixture publishes land in `published/<prId>.json` with `target: "pullrequest"`.

## Quality gates

`npm run check` is format + lint + typecheck + tests.

Tests are the contract:

- engine goldens vs `fixtures/expected`
- shared API ranks above a one-page heading
- `FetchingHeading` stays `component` + `ui.network`
- drafts persist; publish is PR-only
