# playground

Experiment repo. The current experiment on this branch is **Scryglass**.

Start here: [docs/README.md](docs/README.md) · product: [scryglass/README.md](scryglass/README.md)

```bash
cd scryglass && npm install && npm run check && npm run dev
```

High Seat: http://127.0.0.1:8787 — paste a Bitbucket PR URL after setting `BITBUCKET_TOKEN` or `BITBUCKET_USERNAME` + `BITBUCKET_APP_PASSWORD` (see scryglass/README.md).

```bash
npm run cli -- open PR-01
npm run cli -- check
node fixtures/blast-radius.mjs --check
```
