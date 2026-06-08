# Stage 1 — Git Fundamentals

**Goal:** Develop daily engineering habits.

## Lesson

Professional developers commit small, meaningful changes often. Not once a week. Not when a feature is "perfect."

**CommitLoop rule:** minimum one meaningful commit per day.

Acceptable commits:

- Feature implementation
- Refactor
- Bug fix
- Documentation
- Test addition
- Project structure setup

Unacceptable as your only work for days: empty commits, README timestamp tricks, or commits with no real change.

### Git basics you need

```bash
git status          # what changed
git add <files>     # stage changes
git commit -m "..."  # save a snapshot
git push            # send to GitHub
```

Write commit messages that describe **what** and **why**:

- `feat: add user registration form`
- `fix: correct date formatting on dashboard`
- `chore: add eslint config`

## Sandbox Task

In a scratch folder (not your main project):

1. Create a file, commit it.
2. Modify it, commit again.
3. Run `git log --oneline` and read your history.

Delete the scratch folder when done. This was practice.

## Project Implementation

In your project repository:

1. Add project structure: folders for frontend/backend (or as your stack requires).
2. Add a `.gitignore` appropriate for your stack.
3. Add minimal starter code so the app runs locally (even a "hello world").
4. Push at least **3 meaningful commits** across **2 separate days**.

Connect your streak on the dashboard. Watch it turn green.

**Outcome:** Git discipline started. CommitLoop can see your activity.

## Checklist

- [ ] Project structure committed
- [ ] `.gitignore` in place
- [ ] App runs locally (minimal is fine)
- [ ] 3+ meaningful commits pushed
- [ ] Activity visible on CommitLoop dashboard
- [ ] At least one commit on a second day

**Next:** Stage 2 — First End-to-End System (coming soon)
