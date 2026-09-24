# Scryglass

**A scrying glass for pull requests. It does not judge. It reveals.**

Scryglass is a local review cockpit for large frontend PRs. It exists because human attention is now the scarce resource, not typing speed. When a PR can be 3,000+ lines, the expensive part of review is *finding* what matters.

Scryglass turns:

```text
PR → huge diff → reviewer hunts
```

into:

```text
PR → deterministic analysis + fast classification + visual preview → reviewer judges
```

It is **not** an AI code reviewer. The engineer still decides correctness, architecture, product fit, and acceptable risk. Scryglass only lowers the search cost of getting to that judgment.

## How to read these docs

This folder is the living scope of Scryglass. We will iterate here before writing product code.

| Doc | Purpose |
| --- | --- |
| [vision.md](./vision.md) | What the system is, why it exists, and what "done" feels like |
| [principles.md](./principles.md) | Design constraints that every epic must obey |
| [glossary.md](./glossary.md) | Shared language |
| [mvp.md](./mvp.md) | What we build first, and in what order |
| [epics/](./epics/README.md) | Epics, stories, and tasks |

## The seven epics

| ID | Name | Practical job |
| --- | --- | --- |
| [E01](./epics/E01-the-opening/epic.md) | The Opening | Ingest a PR into a local review session |
| [E02](./epics/E02-the-web-of-threads/epic.md) | The Web of Threads | Deterministic impact / blast-radius graph |
| [E03](./epics/E03-the-living-mirror/epic.md) | The Living Mirror | Render the real UI and compare base vs PR |
| [E04](./epics/E04-the-whisper-marks/epic.md) | The Whisper Marks | Fast, non-authoritative attention signals |
| [E05](./epics/E05-the-high-seat/epic.md) | The High Seat | The three-pane review cockpit |
| [E06](./epics/E06-the-chronicle/epic.md) | The Chronicle | Review receipt for humans and agents |
| [E07](./epics/E07-the-foundry/epic.md) | The Foundry | Local runtime, app launch, adapters |

Fantasy names are for orientation. Story IDs and acceptance criteria stay practical.

## What we are iterating on

These docs are a first cut, not a contract. Next passes should tighten:

1. Epic boundaries (what is in vs later)
2. Story size (can a pair finish it without inventing a platform)
3. MVP cut (what a reviewer can actually open)
4. Open questions (Jev interface, first target repo, how apps boot)
