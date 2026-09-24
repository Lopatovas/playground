# MVP cut

Build the smallest useful Scryglass around **one repository**.

The MVP is a loop a reviewer can finish, not a complete platform.

## Phase order

```text
The Opening
    → Web of Threads
        → High Seat (thin)
            → Living Mirror
                → Whisper Marks
                    → Chronicle
```

The Foundry is underneath all of this. It is not a later product — it is the floor the MVP stands on. Scope it tightly: one way to run Scryglass, one way to boot the target app, one adapter.

## MVP in

| Capability | Epic | Why it is in |
| --- | --- | --- |
| Open from branch + base (PR URL if cheap) | E01 | No session, no product |
| Git facts: files, diff, commits | E01 | Raw material |
| Changed symbols for TS / JS / Vue SFC | E01 | Diff-of-files is not enough |
| Persist a local session | E01 | Later layers attach here |
| Import graph + consumers of changed symbols | E02 | Blast radius |
| Route / page mapping for the first framework | E02 | "What feature is this?" |
| Related tests when names/imports make it obvious | E02 | Jump targets |
| Shared vs isolated from graph facts | E02 | Replaces LOC |
| Thin High Seat: map + diff + context | E05 | The product surface |
| Linked selection | E05 | Search-cost reduction |
| Discover likely routes from the graph | E03 | Something to render |
| Playwright screenshots of PR routes | E03 | "What does it look like?" |
| Base vs PR stills + visual diff | E03 | The useful visual workflow |
| Attention input contract + optional Jev | E04 | Can ship with deterministic ranks only |
| Guardrail copy and no-block rule | E04 | Safety of the idea |
| Local runtime + one app-boot convention | E07 | Otherwise Mirror cannot run |
| One framework adapter (Vue-first unless we pick otherwise) | E07 / E02 | Depth over generality |

## MVP out

- Polished Chronicle (a JSON dump of the session is enough at first)
- Storybook / Chromatic / commercial visual platforms
- Video, traces, rich interaction scripts
- Full loading / empty / error / populated matrix unless fixtures already exist
- React / Next adapter
- PR-provider comment posting
- Auth-heavy populated states that need a dedicated data harness
- Treating Jev as required
- Any approval / blocking workflow

## Definition of MVP useful

A reviewer opens a large frontend PR in the first target repo and, within minutes, can:

1. See a change map ordered by blast radius, not LOC
2. Click a shared symbol and see its diff, consumers, and routes
3. See at least one affected route rendered for PR, and compare to base if the app boots
4. Know that any attention colors are hints, not a review

## Open MVP decisions

These need a pass with you before stories are treated as ready to build:

1. **First target repository** — which frontend, how it boots, Vue or React.
2. **How Scryglass itself runs** — local web app, CLI + UI, or desktop wrapper.
3. **Jev** — what it is today, how we call it, what latency we can assume.
4. **PR identity** — local git only vs Bitbucket / GitHub API.
5. **Preview data** — can the target app render useful states without a custom harness?
