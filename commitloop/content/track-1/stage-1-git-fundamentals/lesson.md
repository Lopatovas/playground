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
