## From "a branch" to "a strategy"

Knowing how to make a branch is mechanics. Knowing **which branches exist and how work flows between them** is strategy. Teams adopt a strategy so that everyone integrates work the same way and shared branches stay trustworthy.

A common, practical setup uses **long-lived branches** that represent environments, fed by **short-lived feature branches**.

## The stage ← dev ← feature model

Read the arrows as **"is promoted into"**: work flows *up* from feature branches toward more stable branches.

```text
feature/*   ──merge──▶   dev   ──promote──▶   stage   ──promote──▶   main (production)
 (your work)         (integration)        (pre-prod / QA)          (live)
```

| Branch | Stability | Purpose |
| --- | --- | --- |
| `feature/*` | Throwaway | One feature or fix, built in isolation |
| `dev` | Unstable | Where features **integrate** and get tested together |
| `stage` | Stable-ish | Pre-production: a release candidate for QA |
| `main` | Most stable | What's actually deployed to production |

The golden rule: **you never write new code directly on `dev`, `stage`, or `main`.** New code is born on a `feature/*` branch and *earns* its way up.

## The lifecycle of a change

1. **Branch off the integration branch.** Start your feature from the latest `dev`:

```bash
git switch dev
git pull
git switch -c feature/workout-search
```

2. **Build and commit** on the feature branch — small, meaningful commits.

3. **Push and open a pull request** into `dev`:

```bash
git push -u origin feature/workout-search
```

   A **pull request (PR)** is a request to merge your branch. It's the review checkpoint: someone (or your tests, or future you) looks at the change before it joins shared code.

4. **Merge into `dev`.** Now your feature lives alongside everyone else's, where it can be integration-tested.

5. **Promote `dev` → `stage`** when a batch of features is ready for QA, and **`stage` → `main`** when stage is verified and you're ready to deploy.

## Why the layers?

Each branch is a **quality gate**:

- `dev` answers: *"do all these features work together?"*
- `stage` answers: *"is this release candidate solid in a production-like setting?"*
- `main` answers: *"this is exactly what's live."*

Bugs get caught low (on `dev`) before they can reach users (on `main`). The further up a branch, the higher the bar to change it.

## Right-sizing for a solo project

You're one person on Track 1, so don't cargo-cult a four-branch tree on day one. Start simple and grow into it:

- **Now:** `main` + `feature/*` branches, merged via PRs. This alone builds the habit.
- **Later (Stage 3+):** add a `dev` integration branch once you have multiple features in flight.
- **At deployment (Stage 4):** add `stage`/production separation so you can verify before going live.

The point isn't ceremony — it's that **you can reason about where code lives and how it's promoted**. That judgment is what separates someone who "knows Git commands" from someone who can manage a real codebase.
