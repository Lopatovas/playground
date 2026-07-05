Bring the feature branch's work back into your main line with a merge.

```bash
git switch main
git merge feature/greeting
ls   # greeting.txt is now here too
```

Git fast-forwards or creates a merge commit, and `greeting.txt` now lives on `main`. Clean up the merged branch:

```bash
git branch -d feature/greeting
```

In a real team (and in your project from here on), you usually **push the branch and open a pull request** instead of merging locally:

```bash
git switch -c feature/greeting
# ...commits...
git push -u origin feature/greeting
# then open a PR on GitHub to merge into dev/main
```

The pull request is the review gate — it's where work gets a second look before joining a shared branch.
