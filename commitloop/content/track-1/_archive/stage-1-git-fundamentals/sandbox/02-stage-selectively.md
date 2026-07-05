You often change several files but want **separate, focused commits**. Staging selectively makes that possible.

Imagine you edited both `a.txt` and `b.txt` but they're unrelated changes. Stage and commit them one at a time:

```bash
git add a.txt
git diff --staged      # review exactly what you're about to commit
git commit -m "Update a.txt with more content"

git add b.txt
git commit -m "Add b.txt"
```

Compare with the shortcut that stages everything at once:

```bash
git add .              # stages all changes in the current directory
```

Both are valid — but reaching for `git add .` by reflex leads to noisy, do-everything commits. Stage with intent.
