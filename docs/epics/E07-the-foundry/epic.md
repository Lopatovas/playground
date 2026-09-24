# E07 — The Foundry

**Practical name:** Local runtime, app lifecycle, adapters  
**Status:** Draft  
**MVP:** Yes (thin floor)

## Intent

Scryglass is a local/internal tool. The Foundry is how it runs, how it boots the target application, how framework knowledge is plugged in, and how preview data is supplied without a commercial visual-testing platform.

This epic is unglamorous and load-bearing. If the Foundry is vague, the Mirror never lights.

## Why this epic exists

Ingestion, graphs, and Playwright all assume a machine that can see a git checkout and start an app. That is a product surface, not an implementation detail.

## Outcomes

- A supported way to run Scryglass locally
- A supported way to boot the target app (and later, base)
- Adapters as modules, not `if (vue)` soup
- A honest story about preview data

## In scope

- Local runtime
- Target app lifecycle
- Adapter plugin model
- Preview fixtures / auth / data

## Out of scope

- Multi-tenant SaaS
- Requiring Chromatic, Percy, Happo, Loki, or Backstop
- A generic Git host clone of every feature

## Stories

| ID | Title | MVP |
| --- | --- | --- |
| [S01](./S01-local-runtime.md) | Local runtime | Yes |
| [S02](./S02-target-app-lifecycle.md) | Target app lifecycle | Yes |
| [S03](./S03-adapter-plugin-model.md) | Adapter plugin model | Yes (in-process is enough) |
| [S04](./S04-preview-data-and-fixtures.md) | Preview data and fixtures | After MVP unless the first repo cannot render without it |

## Dependencies

- A first target repository
- Decisions listed in [mvp.md](../../mvp.md)

## Open questions

- First target repo and boot command
- Electron vs localhost web vs CLI-first
- How secrets for the target app are handled on a reviewer's machine
