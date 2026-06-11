Now make a throwaway commit in a scratch folder to feel the core loop.

```bash
mkdir git-practice
cd git-practice
git init
echo "hello git" > notes.txt
git status
```

`git init` turns the folder into a repository. `git status` shows `notes.txt` as **untracked** — Git sees it but isn't following it yet.

Stage it, then commit it:

```bash
git add notes.txt
git commit -m "Add notes file"
```

`git add` moves the file into the **staging area** (the set of changes that go into the next commit). `git commit -m "..."` saves that snapshot with a message.

Run `git log --oneline` to see your commit in the history.
