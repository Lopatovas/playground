# Scryglass

**A scrying glass for pull requests. It does not judge. It reveals.**

Scryglass is a local review cockpit for large frontend PRs. It is **not** an AI code reviewer.

Three jobs:

1. **What it is** — from the change and the UI, not from a 2,000-line AI Jira spec.
2. **How risky it is, and the key points** — computed from imports / blast radius. A heading on one page is noise; a shared API change is the review. Jev is optional on top.
3. **Actually review** — a better UX than Bitbucket: comments on the PR, consecutive sittings that keep context.

Until we have Bitbucket access, dogfood is the local fixture: [fixtures/README.md](../fixtures/README.md).

## How to read these docs

| Doc | Purpose |
| --- | --- |
| [vision.md](./vision.md) | What the system is |
| [context.md](./context.md) | What we learned from the design passes |
| [principles.md](./principles.md) | Constraints every epic must obey |
| [glossary.md](./glossary.md) | Shared language |
| [mvp.md](./mvp.md) | What we build first |
| [tools.md](./tools.md) | Open-source tools we absorb instead of rebuilding |
| [attention-flags.md](./attention-flags.md) | Deterministic flags beyond blast radius |
| [epics/](./epics/README.md) | Epics, stories, and tasks |
| [../fixtures/README.md](../fixtures/README.md) | Deterministic sample app + sample PRs |

## The eight epics

| ID | Name | Job | Practical work |
| --- | --- | --- | --- |
| [E01](./epics/E01-the-opening/epic.md) | The Opening | floor | Open a Bitbucket PR; fetch, checkout, session |
| [E02](./epics/E02-the-web-of-threads/epic.md) | The Web of Threads | **2. focus** | Deterministic impact / blast radius |
| [E03](./epics/E03-the-living-mirror/epic.md) | The Living Mirror | **1. what it is** | See the feature |
| [E04](./epics/E04-the-whisper-marks/epic.md) | The Whisper Marks | **2. focus** | Jev / graph attention signals |
| [E05](./epics/E05-the-high-seat/epic.md) | The High Seat | **3. review UX** | Three-pane cockpit |
| [E06](./epics/E06-the-chronicle/epic.md) | The Chronicle | later | Receipt |
| [E07](./epics/E07-the-foundry/epic.md) | The Foundry | floor | Runtime, host adapters, language adapters |
| [E08](./epics/E08-the-palimpsest/epic.md) | The Palimpsest | **3. review UX** | Comments and consecutive review |
