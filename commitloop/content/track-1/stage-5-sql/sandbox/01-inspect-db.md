## Look at the rows directly

After curl POST creates a workout:

```bash
sqlite3 data/app.db "SELECT * FROM workouts;"
```

Or open DB Browser → Browse Data → `workouts` → refresh.

If curl returned 201 but SELECT shows zero rows, your INSERT didn't commit to the file you're inspecting — check `DATABASE_URL` path.
