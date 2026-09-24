# MVP cut

The first user is **one chapter lead**, on **one Bitbucket instance**, across **many frontend repos**.

Do not build a platform. Build the three jobs they would switch for.

## Three MVP jobs

```text
1. What is it              2. Risk + key points       3. Review UX
─────────────────          ─────────────────          ─────────────────
Living Mirror stills       Web of Threads (computed)  High Seat
Routes / changed symbols   Blast radius               Draft comments
                           Shared API > heading       Publish to the PR
                           No Jev required            What changed since last sitting
```

Foundry + Opening are the floor: local runtime, Bitbucket adapter, auto-checkout, generic TS/JS analysis.

## Phase order

```text
Foundry (runtime + Bitbucket adapter)
    → Opening (PR URL, fetch, checkout, session)
        → Web of Threads (job 2 — generic JS/TS first)
            → High Seat (thin)
                → Living Mirror (job 1 — stills when the app boots)
                    → Palimpsest (job 3 — drafts, publish, second sitting)
                        → Whisper Marks (stub, then Jev)
                            → Chronicle
```

Job 2 ships before Jev and is proven on [fixtures/](../fixtures/README.md) until Bitbucket access exists. A graph that puts `customerApi` above `SettingsHeading` is already the product. Jev only sharpens it.

## MVP in

| Capability | Epic | Job |
| --- | --- | --- |
| Open from a Bitbucket PR URL | E01 / E07 | floor |
| Scryglass fetches and checks out | E01 | floor |
| Git facts + changed symbols (TS/JS) | E01 | floor |
| Persist / resume a session per PR | E01 / E08 | 3 |
| Import graph + consumers | E02 | **2** |
| Shared vs isolated (heading vs shared API) | E02 | **2** |
| Attention map from graph ranks | E04 / E05 | **2** |
| Thin High Seat: map + diff + context | E05 | **3** |
| Linked selection | E05 | **3** |
| Discover + screenshot likely routes when the app can boot | E03 | **1** |
| Draft inline + general comments | E08 | **3** |
| Batch publish to the **PR**, never only a commit | E08 | **3** |
| What changed since last sitting | E08 | **3** |
| Guardrail copy | E04 | 2 |
| Bitbucket host adapter + generic language adapter | E07 | floor |

## MVP out

- GitHub / GitLab / second Bitbucket instance (adapter interface stays)
- Polished Chronicle
- Storybook / commercial visual platforms
- Video, traces, full state matrix
- Requiring Vue *or* React — ship generic JS/TS; add one framework adapter if a real PR needs it
- Deep PHP or Electron-specific analysis (usable raw session is enough)
- Jev as a required service (no key yet) — job 2 still works
- LLM Jira summaries
- Approval / blocking workflows
- AI-written comments

## Definition of MVP useful

The chapter lead pastes a Bitbucket PR URL and can:

1. Tell what feature this is, preferably by seeing it
2. See a shared API change ranked above a one-page heading — without counting lines
3. Leave comments that appear on the **pull request**
4. Open the same PR tomorrow and see what is new, with yesterday's comments still attached

If (2) fails, Scryglass is just a prettier Bitbucket. That is not enough.

## Decisions we already made

- First user: just them
- Host now: one Bitbucket; adapters later
- Checkout: Scryglass may do it
- Jev: TypeSafe System One; stub until access
- Tickets: optional; not the understanding path
- Three jobs, all in MVP (Jev is optional inside job 2)
- Visuals: comprehension, not QA

## Still open

- Bitbucket Cloud vs Data Center (API shape)
- How often a random consultancy frontend will boot with one convention
- Whether preview/staging URLs on the PR are common enough to use before local boot
- Which real PR we use as the first dogfood
