A commit message is documentation. Practice the Conventional Commits style:

```text
<type>: <imperative summary>
```

Try writing messages for these imaginary changes before you peek:

- You added a route that returns all workouts → `feat: add endpoint to list workouts`
- You fixed a crash on empty input → `fix: handle empty workout name`
- You moved the DB setup into its own file → `refactor: extract database client module`

Now look at the difference in your own history:

```bash
git log --oneline
```

A log full of `feat:`, `fix:`, and `refactor:` reads like a changelog. A log full of `stuff`, `wip`, and `asdf` reads like noise. Future you will thank present you for the former.
