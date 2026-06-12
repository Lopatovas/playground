## Refactor ≠ rewrite

A **refactor** changes the *internal structure* of code without changing its *external behavior*. Users should not notice. Tests (and manual checks) should still pass.

| Refactor | Not a refactor |
| --- | --- |
| Extract SQL into a repo file | Add a new "delete workout" feature |
| Split a 200-line handler into route + service | Change what POST returns |
| Rename `getAll` → `listWorkouts` | Switch databases in production |

If behavior changes, it's a **feature** or a **bugfix** — commit it as such.

## Why a feature branch

Refactors touch many files. Doing that directly on `main` is risky:

- Hard to review ("what actually changed?")
- Hard to revert if something breaks
- Teammates (or future you) get surprised

Instead:

```bash
git switch -c refactor/api-layers
# ... extract services, add validation, update frontend states ...
git push -u origin refactor/api-layers
# open PR, review diff, merge
```

The branch isolates restructuring from ongoing work.

## Small commits, still working

The best refactor rhythm:

1. **Extract** one piece (e.g. move SQL to `workout.repo.js`)
2. **Run the app** — does GET /workouts still work?
3. **Commit**: `refactor: extract workout repository`
4. Repeat

Avoid a single 2,000-line "refactored everything" commit. Small steps mean small mistakes.

## A refactor checklist

Before merging:

- [ ] `GET` still returns the same data shape
- [ ] `POST` still creates records correctly
- [ ] Invalid input returns 400, not 500
- [ ] Frontend list still loads, including empty state
- [ ] Frontend form still creates and refreshes

If all five pass, the refactor succeeded — even if every file moved.

## When to stop refactoring

Structure is a means, not the goal. Stop when:

- Each layer has a clear job
- You can add a second entity (e.g. `categories`) by copying the pattern
- You're not afraid to open the codebase tomorrow

Perfection is the enemy. **Good enough structure** that you ship daily beats textbook architecture you never finish.
