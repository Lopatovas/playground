Replace your API's **in-memory array** with a **real database** so data survives server restarts. The frontend stays the same — only the API's storage layer changes.

## 1. Add SQLite to `api/`

Use `better-sqlite3` or `sql.js` — pick one and open a file like `data/app.db`.

Create your table:

```sql
CREATE TABLE workouts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  duration_min INTEGER NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

Commit: `feat: add workouts table`.

## 2. Swap GET to SQL

```javascript
app.get("/workouts", (req, res) => {
  const rows = db.prepare("SELECT * FROM workouts").all();
  res.json(rows);
});
```

Delete the in-memory array. Test with curl.

Commit: `feat: read workouts from database`.

## 3. Swap POST to SQL

Use a **parameterized** INSERT:

```javascript
const stmt = db.prepare(
  "INSERT INTO workouts (name, duration_min) VALUES (?, ?)",
);
const result = stmt.run(name, duration_min);
const created = db
  .prepare("SELECT * FROM workouts WHERE id = ?")
  .get(result.lastInsertRowid);
res.status(201).json(created);
```

Commit: `feat: persist workouts on create`.

## 4. Prove persistence

1. Add a workout through the UI
2. Stop and restart the API
3. Refresh the browser — data is still there

## 5. Optional: GET by id

Add `GET /workouts/:id`. Return `404` when no row matches.

## Outcome

Full stack connected: **UI → API → database**. Same URLs as Stage 3; storage is real. Next: deploy it, test it, then grow it.
