Create a couple of files and watch how Git categorizes them.

```bash
echo "line one" > a.txt
echo "line two" > b.txt
git add a.txt
git commit -m "Add a.txt"

echo "more" >> a.txt   # edit a tracked file
git status
```

Read the output carefully. You should see:

- `a.txt` under **"Changes not staged for commit"** — it's tracked, but your latest edit isn't staged.
- `b.txt` under **"Untracked files"** — Git has never been told to follow it.

This is the three-areas model in action. `git status` always tells you where each change lives.
