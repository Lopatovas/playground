## The problem Git solves

Without version control, saving your work looks like this:

```text
project-final/
project-final-v2/
project-final-REALLY-final/
project-backup-copy/
```

That's painful, error-prone, and impossible to collaborate on. You can't see *what* changed between versions, *why*, or *who* did it — and you can't safely undo a mistake.

**Git** solves this. It records the full history of your project as a series of **commits** — snapshots you can inspect, compare, and return to at any time.

## What a commit really is

A commit is a **snapshot of your whole project** at a moment in time, plus metadata:

- a unique id (a hash like `a1b2c3d`)
- the author and date
- a message describing the change
- a pointer to its parent commit

Chained together, commits form your project's history — a story you can read with `git log`.

## The three areas

This is the single most important mental model in Git. A change moves through **three areas**:

| Area | What it holds | How you move things in |
| --- | --- | --- |
| **Working directory** | The files you're editing right now | You edit files |
| **Staging area** (index) | The changes selected for the next commit | `git add` |
| **Repository** | The committed history | `git commit` |

```text
edit files          git add            git commit
working dir  ───▶   staging area  ───▶   repository
```

Why a staging area at all? Because it lets you commit **deliberately**. You might change five files but only want two of them in this commit — staging gives you that control. Each commit can be a clean, focused unit.

## Local vs remote

Everything above happens **on your machine**. GitHub is a **remote** copy.

- `git push` sends your local commits up to the remote.
- `git pull` brings remote commits down to your machine.

So the full lifecycle of a change is: **edit → `git add` → `git commit` → `git push`**. Keep that loop in your head; the next page makes it muscle memory.
