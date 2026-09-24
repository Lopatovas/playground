# Glossary

| Term | Meaning |
| --- | --- |
| **Scryglass** | The system. A local cockpit that reveals what matters in a large PR. |
| **High Seat** | The review UI. Three linked panes: change map, feature/diff, context. |
| **The Opening** | Ingesting a PR or branch pair into a local review session. |
| **Web of Threads** | Deterministic impact graph: files, symbols, consumers, routes, tests. |
| **Living Mirror** | Rendered UI of affected routes/states, including base vs PR. |
| **Whisper Mark** | A non-authoritative attention signal. Never a review or approval. |
| **Jev** | TypeSafe AI's System One model. Typed Choice / Score / Noul decisions with confidence. No prose. Stubbed until we have access. |
| **Chronicle / Receipt** | Machine- and human-readable artifact of what Scryglass observed. |
| **Foundry** | Local runtime, host adapters, app launch, and language adapters. |
| **Host adapter** | Bitbucket now; later more Bitbucket instances, GitHub, GitLab. |
| **The Palimpsest** | Comments plus consecutive review: yesterday's writing still visible under today's change. |
| **Draft comment** | A note in Scryglass that has not been published to the host. |
| **Published comment** | A comment pushed to the **pull request** (never commit-only). |
| **Sitting** | One stretch of review on a PR. The next sitting is a consecutive review. |
| **Review session** | One opened PR/branch pair plus all analysis attached to it. |
| **Changed symbol** | A named unit that actually changed: function, component, export, store, route. |
| **Consumer** | A symbol or file that depends on a changed symbol. |
| **Blast radius** | How widely a change can reach: consumers, features, routes, tests. |
| **Shared vs isolated** | Whether a change sits on a widely used path or in a leaf feature. |
| **Render target** | Something Scryglass can open in a browser: route, state, story, or test. |
| **Review manifest** | Optional developer file listing routes/states/stories to render. Fallback only. |
| **Attention map** | Ranked list of files/symbols with HIGH / MEDIUM / LOW signals. |
| **Linked selection** | Clicking one symbol updates map, center stage, and context together. |
| **Job 1** | Understand what the PR is (feature, UI). |
| **Job 2** | Understand where focus should go (shared API > one-page heading). |
| **Job 3** | Actually review: comments on the PR, consecutive sittings. |
| **Focus** | Where the reviewer should spend minutes. Not a verdict, not LOC. |
| **Risk** | Derived from the flag bundle (spine / high / medium / low). Not Jev. Not LOC. |
| **Attention flag** | Named computed fact (`reach.wide`, `test.gap`, `surface.auth`, …) with a why. |
| **Key points** | The few changed nodes that deserve minutes. Sorted by flags, then reach. |
| **loom-shop** | Local fixture app used as dogfood until Bitbucket access exists. |

## Language we will not use for Jev output

- review
- approval
- LGTM
- correct / incorrect
- safe / unsafe (as a verdict)
- block / fail the PR
