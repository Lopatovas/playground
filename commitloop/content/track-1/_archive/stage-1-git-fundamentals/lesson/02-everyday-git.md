## The commands you'll use every day

You only need a handful of commands for 95% of your work. Learn these cold.

```bash
git status          # what changed, and where it is in the three areas
git add <files>     # stage changes for the next commit
git commit -m "..." # save a snapshot with a message
git push            # send commits to GitHub
git pull            # bring down commits from GitHub
git log --oneline   # read your history, compactly
git diff            # see exactly what changed, line by line
```

## `git status` is your home base

Run `git status` constantly. It tells you which area every change is in:

```text
Changes to be committed:        # staged — going into the next commit
  modified:   src/app.js

Changes not staged for commit:  # tracked, but edits not staged yet
  modified:   README.md

Untracked files:                # brand-new, Git isn't following them
  notes.txt
```

If you ever feel lost, `git status` re-orients you.

## `git diff` shows the actual changes

`git status` lists *which* files changed. `git diff` shows *what* changed inside them:

```bash
git diff             # unstaged changes
git diff --staged    # what's staged for the next commit
```

Reading your own diff before committing is a pro habit — it catches stray debug logs and accidental edits.

## Staging: all vs selective

```bash
git add .                 # stage everything in the current directory
git add src/app.js        # stage just one file
git add src/              # stage a whole folder
```

`git add .` is convenient, but staging selectively lets you split unrelated changes into separate, meaningful commits.

## Committing

```bash
git commit -m "feat: add workout list endpoint"
```

The `-m` flag attaches the message inline. We'll cover *what* to write on the next page.

## Pushing and pulling

```bash
git push     # upload local commits to origin
git pull     # download and merge remote commits
```

Push often — your work isn't backed up (or visible to CommitLoop) until it's on GitHub.
