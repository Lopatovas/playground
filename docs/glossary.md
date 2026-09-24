# Glossary

| Term | Meaning |
| --- | --- |
| **Scryglass** | The system. A local cockpit that reveals what matters in a large PR. |
| **High Seat** | The review UI. Three linked panes: change map, feature/diff, context. |
| **The Opening** | Ingesting a PR or branch pair into a local review session. |
| **Web of Threads** | Deterministic impact graph: files, symbols, consumers, routes, tests. |
| **Living Mirror** | Rendered UI of affected routes/states, including base vs PR. |
| **Whisper Mark** | A non-authoritative attention signal. Never a review or approval. |
| **Jev** | The fast probabilistic classifier behind Whisper Marks. |
| **Chronicle / Receipt** | Machine- and human-readable artifact of what Scryglass observed. |
| **Foundry** | Local runtime, target-app launch, and framework adapters. |
| **Review session** | One opened PR/branch pair plus all analysis attached to it. |
| **Changed symbol** | A named unit that actually changed: function, component, export, store, route. |
| **Consumer** | A symbol or file that depends on a changed symbol. |
| **Blast radius** | How widely a change can reach: consumers, features, routes, tests. |
| **Shared vs isolated** | Whether a change sits on a widely used path or in a leaf feature. |
| **Render target** | Something Scryglass can open in a browser: route, state, story, or test. |
| **Review manifest** | Optional developer file listing routes/states/stories to render. Fallback only. |
| **Attention map** | Ranked list of files/symbols with HIGH / MEDIUM / LOW signals. |
| **Linked selection** | Clicking one symbol updates map, center stage, and context together. |

## Language we will not use for Jev output

- review
- approval
- LGTM
- correct / incorrect
- safe / unsafe (as a verdict)
- block / fail the PR
