# Vision

## The problem

Frontend PRs routinely contain thousands of changed lines, especially once code generation is cheap. Traditional diff review assumes the reviewer can scan the whole change. That assumption is now false.

The scarce resource is **human cognitive search**.

A 3,000-line isolated feature can be less important than a 50-line edit to a shared API abstraction. Line count is almost useless as a risk signal. Reviewers need to know *what could matter* before they read.

## The job

Scryglass makes important information visible **before and during** review.

A reviewer should open a huge frontend PR and answer these questions within minutes:

1. What feature did they build?
2. What does it actually look like?
3. What routes and states changed?
4. What shared code changed?
5. What has the largest blast radius?
6. Where is business / state / data-flow logic?
7. Which areas deserve attention first?
8. Can I jump from a signal to the relevant code and UI?

The metric is not "did the tool review the PR?"

The metric is: **how much less time did the human need to understand the PR well enough to review it properly?**

## Three layers

```text
                    PR
                     │
        ┌────────────┼────────────┐
        ↓            ↓            ↓
   Git / AST       Playwright     Jev
        │            │            │
        ↓            ↓            ↓
  Impact Graph    UI Preview   Attention
        │            │            │
        └────────────┼────────────┘
                     ↓
                 High Seat
                     │
                     ↓
              HUMAN JUDGMENT
```

1. **Deterministic analysis** — repository facts: what changed, which symbols, who consumes them, which routes and tests are involved, what is shared vs isolated. Never invented by a model.
2. **Whisper Marks (Jev)** — a generic, very fast classifier that highlights things worth looking at. It can be wrong. That is acceptable. It is never presented as authority.
3. **Human review** — the engineer judges. The UI makes signal → context → code → rendered result one click.

## What the reviewer sees

The High Seat is a local cockpit. Opening a PR should immediately show:

- **Living Mirror** — the actual feature, preferably the real app, not only Storybook. Base vs PR. Desktop / tablet / mobile. Loading / empty / populated / error.
- **Web of Threads** — semantic impact, not LOC. Shared abstractions light up harder than isolated new pages.
- **Whisper Marks** — an attention map. Bars and categories, never "this is bad" or "LGTM".
- **Code / diff** — a review surface that can jump between changed symbol, source context, consumers, graph, rendered UI, tests, and the original diff.

## What Scryglass is not

- An autonomous approver
- An AI comment bot
- A replacement for tests or CI
- Another Jira, Git client, or ticket reader
- A system that treats line count as risk
- A system that assumes model output is correct

AI may exist behind the scenes. The primary system must work without it.

## First useful product

The smallest useful Scryglass is one target repository where a reviewer can:

1. Point it at a PR or branch pair
2. See what changed at symbol / impact level
3. See the feature rendered
4. Jump from a high-impact node into code and UI

Attention classification and a polished receipt can arrive after that loop works.
