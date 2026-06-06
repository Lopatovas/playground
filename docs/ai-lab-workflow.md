# AI Lab Docs Workflow

## Purpose

Use each repo or branch as the source of truth for its own project docs.

Use Cabinet as the review layer across projects.

## Architecture

```text
micro-project repo/branch
  docs/
    project-brief.md
    implementation-log.md
    decisions.md
    validation-notes.md
    next-steps.md
    cabinet-summary.md
        |
        v
central Cabinet project
  projects/
    project-a.md
    project-b.md
    project-c.md
```

Each project owns its detailed docs.

Cabinet owns the short index, review pages, and cross-project memory.

## Update flow

1. Start a Cursor Cloud task from phone.
2. Agent implements the micro-project in one repo or branch.
3. Agent updates the project docs.
4. Agent writes or refreshes `docs/cabinet-summary.md`.
5. Later, the Cabinet project pulls summaries from GitHub.
6. Review, compare, and decide what to continue.

Do not require one agent chat to write to two repos.

## Cabinet update options

### Manual sync

Pull summaries locally when reviewing on MacBook.

Best for early experiments.

### Scheduled sync

Run a GitHub Action in the Cabinet repo that fetches each `docs/cabinet-summary.md` and commits updated Cabinet pages.

Best after the workflow proves useful.

### Separate Cabinet task

Open a dedicated Cursor task in the Cabinet repo:

```text
Pull latest project summaries from these repos/branches and update the Cabinet project index.
```

Best when summaries need cleanup or judgment.

## Cabinet use cases

- project portfolio overview
- active vs parked vs dead project tracking
- weekly learning review
- reusable prompt library
- tool and agent comparison notes
- decision log
- product idea backlog
- validation checklist dashboard
- "what should I continue next?" review

## Rule of thumb

Project repos keep details.

Cabinet keeps memory, summaries, and decisions.
