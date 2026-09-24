# E07 — The Foundry

**Practical name:** Local runtime, host adapters, app lifecycle, language adapters  
**Status:** Draft  
**MVP:** Yes (thin floor)  
**Job:** floor

## Intent

Scryglass is a local tool for one reviewer. The Foundry is how it runs, how it talks to Bitbucket, how it boots an app when it can, how language/framework knowledge is plugged in, and how preview data is supplied without a commercial visual-testing platform.

This epic is unglamorous and load-bearing. If the Foundry is vague, Opening and Mirror never light.

## Why this epic exists

The chapter lead does not live in one repo. Hosts and frameworks must be adapters. MVP is one Bitbucket instance and a generic JS/TS floor.

## Outcomes

- A supported way to run Scryglass locally
- A Bitbucket adapter: resolve PR, clone/fetch, publish comments
- A supported way to boot a target app when we know how
- Language/framework adapters as modules
- An honest story about preview data

## In scope

- Local runtime
- Host adapter interface + Bitbucket implementation
- Target app lifecycle
- Language/framework adapter plugin model
- Preview fixtures / auth / data

## Out of scope

- Multi-tenant SaaS
- Requiring Chromatic, Percy, Happo, Loki, or Backstop
- Shipping GitHub and GitLab implementations in MVP (keep the interface)

## Stories

| ID | Title | MVP |
| --- | --- | --- |
| [S01](./S01-local-runtime.md) | Local runtime | Yes |
| [S02](./S02-target-app-lifecycle.md) | Target app lifecycle | Yes |
| [S03](./S03-adapter-plugin-model.md) | Adapter plugin model | Yes (in-process is enough) |
| [S04](./S04-preview-data-and-fixtures.md) | Preview data and fixtures | After MVP unless a dogfood PR cannot render without it |
| [S05](./S05-host-adapters.md) | Host adapters (Bitbucket first) | Yes |

## Dependencies

- One Bitbucket instance and credentials
- Decisions in [mvp.md](../../mvp.md)

## Open questions

- Bitbucket Cloud vs Data Center
- How a random consultancy frontend boots
- Token storage on the reviewer's machine
