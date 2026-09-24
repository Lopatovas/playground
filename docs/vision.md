# Vision

## Who this is for

The first user is a frontend chapter lead. They sit across many client and internal codebases. A week can include Vue, React, Next, a PHP app with Vue injected, and an Electron shell.

They do not need another AI that "reviews" the PR. They need three things Bitbucket (and Jira) do not give them.

## The three jobs

### 1. Understand what the PR is

Jira is often a 2,000-line AI spec. That text is a poor interface for "what did they build?" Another model summarizing the ticket loses more of the same context.

Answer this from the change and the UI:

- What feature showed up?
- What does it look like?
- What routes and states are involved?

Visuals are a **comprehension tool**. They are not a visual-QA product.

### 2. Understand where focus should go

Not every changed line deserves the same minutes. A heading component on one page is almost noise. A change to how the shared API abstraction works is the review.

Line count cannot make this distinction. Scryglass must.

Answer:

- What is shared vs isolated?
- What has blast radius?
- Where is data-flow / state / business logic?
- Where should I look first?

The Web of Threads computes this from repository facts. Whisper Marks may refine it. Neither is a verdict.

### 3. Actually review, with a better UX

Bitbucket is a poor review surface: consecutive sittings lose context, comments on a commit do not live on the PR, and the diff is a file list.

Scryglass is the place to:

- navigate from a high-focus node to code, consumers, and UI
- draft inline and general comments
- publish them in a batch **onto the pull request**
- come back when the author pushes and see what is new, with old comments still in context

The human still judges. Scryglass carries the seat, the map, the mirror, and the pen.

## The scarce resource

Frontend PRs routinely contain thousands of changed lines. The expensive part is **seeing** what it is, **choosing** what deserves attention, and **not losing** the review when the branch moves.

## How the jobs sit in the system

```text
                 Bitbucket PR
                      │
         ┌────────────┼────────────┐
         ↓            ↓            ↓
      Mirror      Web + Marks    Palimpsest
         │            │            │
    what is it    where to look   the review
         │            │            │
         └────────────┼────────────┘
                      ↓
                  High Seat
                      │
                      ↓
              HUMAN JUDGMENT
                      │
                      ↓
              published to the PR
```

1. **Deterministic analysis** — repository facts. Never invented by a model. This is how job 2 stays honest.
2. **Whisper Marks (Jev)** — TypeSafe's fast typed classifier. Signals only. Stubbed until we have access.
3. **Human review** — judgment, comments, and the next sitting.

## What Scryglass is not

- An autonomous approver
- An AI comment bot (it publishes *your* comments)
- A replacement for tests or CI
- Another Jira, or a ticket-summarizer
- Another generic Git client
- A system that treats line count as risk
- A system that assumes model output is correct
- A visual-regression SaaS

## First useful product

Paste a Bitbucket PR URL. Scryglass fetches and checks the change out. The High Seat shows **what it is** and **what to look at first** (shared API above a one-page heading). Comments draft locally and publish to the PR. A second open of the same PR shows what is new.

Jev, extra hosts, and a polished Chronicle can arrive after that loop is something the chapter lead would actually use instead of Bitbucket's diff.
