## Commits are messages to the future

The person who reads your Git history most is **future you**, six weeks from now, trying to understand why something works the way it does. Good commits make that person's life easy.

Two habits make commits good: **scope** (one logical change per commit) and **message** (a clear description of what and why).

## One logical change per commit

A commit should capture a single, coherent step. Don't bundle an unrelated bug fix into a feature commit — split them:

```bash
git add src/validation.js
git commit -m "fix: reject empty workout names"

git add src/routes/workouts.js
git commit -m "feat: add endpoint to delete a workout"
```

Small, focused commits are easier to review, easier to understand, and easier to undo if one turns out to be wrong.

## Writing the message

A widely used convention is **Conventional Commits**: a short type prefix, then a concise summary in the imperative mood.

| Prefix | Use for |
| --- | --- |
| `feat:` | A new feature |
| `fix:` | A bug fix |
| `refactor:` | Restructuring code without changing behavior |
| `docs:` | Documentation only |
| `test:` | Adding or fixing tests |
| `chore:` | Tooling, config, dependencies |

```text
feat: add email validation to the signup form
fix: correct date formatting on the dashboard
refactor: extract database client into its own module
```

Guidelines:

- Keep the summary under ~60 characters.
- Use the imperative: "add", "fix", "remove" — as if completing the sentence *"This commit will…"*.
- Describe the **change and intent**, not the files touched.

## What CommitLoop counts

CommitLoop expects **at least one meaningful commit per weekday** (weekends are grace). Meaningful means real work:

- features, fixes, refactors
- tests, documentation, project structure

What does **not** count: empty commits, README-timestamp tricks, or anything with no real change. The streak measures momentum on a real project — quality over volume, every time.
