Commits so far live **only on your machine**. To get them onto GitHub you connect a remote and push.

When you create a repository on GitHub, it gives you these commands:

```bash
git remote add origin https://github.com/you/your-repo.git
git branch -M main
git push -u origin main
```

- `git remote add origin <url>` tells Git where the remote lives (named `origin` by convention).
- `git push -u origin main` uploads your local `main` branch and remembers it, so next time you can just run `git push`.

The flow you'll repeat forever: **edit → `git add` → `git commit` → `git push`**. Local first, then up to the remote.

You can delete the `git-practice` folder now — that was rehearsal. The real thing happens in the Project step.
