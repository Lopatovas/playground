No commands here — this one is about **judgment**. Picture a project with three long-lived branches and feature branches feeding in:

```text
feature/*  ──▶  dev  ──▶  stage  ──▶  main
```

Reason through these scenarios:

- **You start a new feature.** Where do you branch from? → from `dev` (the latest integration point), as `feature/your-thing`.
- **Your feature is done.** Where does it merge? → into `dev`, via a pull request, so it integrates and gets tested with everything else.
- **QA needs a release candidate.** What moves? → `dev` is promoted into `stage`.
- **A nasty bug reaches users.** Where is the gate that should have caught it? → `dev` and `stage` exist precisely to catch issues before `main`.

The mechanics (branch, commit, merge) are the same everywhere. The strategy is just **agreeing where code is born and how it's promoted** so shared branches stay trustworthy. Internalize the flow and you can manage any branching model a team throws at you.
