Make a feature branch, do work on it, and confirm `main` stays untouched.

```bash
git switch -c feature/greeting
echo "hello from a branch" > greeting.txt
git add greeting.txt
git commit -m "feat: add greeting file"
```

Now hop back to `main` and look:

```bash
git switch main
ls
```

`greeting.txt` is **gone** — because it only exists on `feature/greeting`. Your main line is undisturbed. Switch back and it returns:

```bash
git switch feature/greeting
ls   # greeting.txt is back
```

This is the superpower of branches: parallel work that doesn't collide until you choose to merge.
