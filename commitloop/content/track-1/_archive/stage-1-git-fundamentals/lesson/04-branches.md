## What a branch is

A branch is **a movable pointer to a commit**. That's it. When you commit, the branch pointer moves forward to the new commit. Creating a branch is cheap and instant — it's just a new pointer, not a copy of your files.

The default branch is usually called `main`. When you make a second branch, you get two parallel lines of work that can move independently:

```text
            A───B───C   (main)
                 \
                  D───E   (feature/login)
```

Both `main` and `feature/login` share history up to `B`, then diverge.

## Why branches matter

Branches let you work on something **without disturbing stable code**. You can:

- build a feature in isolation, then merge it when it's ready
- experiment freely — if it doesn't work out, delete the branch
- keep `main` always working, because half-finished work lives elsewhere

This is the foundation of professional workflows and the next page's strategy.

## Creating and switching

```bash
git switch -c feature/login   # create + switch (modern)
git checkout -b feature/login # create + switch (classic, same result)
```

Move between existing branches:

```bash
git switch main
git switch feature/login
git branch          # list local branches; * marks the current one
```

> Tip: name branches by intent — `feature/...`, `fix/...`, `refactor/...`. A glance at the branch list should tell the story.

## Merging

When a branch is done, you **merge** it into another. Switch to the target branch, then merge:

```bash
git switch dev
git merge feature/login
```

Git combines the histories. If the same lines changed in both branches, you get a **merge conflict** — Git pauses and marks the spots so you can choose the right result, then commit the merge. Conflicts feel scary the first time and routine by the tenth.

## Cleaning up

After a feature branch is merged, delete it — the work is preserved in the target branch's history:

```bash
git branch -d feature/login
```
