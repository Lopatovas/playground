Replace your API's **in-memory array** with **SQLite** so data survives server restarts. Test with **curl** and inspect rows in **sqlite3** or DB Browser — UI wiring comes in Stage 6.

## 1. Add SQLite to `api/`

Use `better-sqlite3` or `sql.js` — pick one and open the path from `process.env.DATABASE_URL`:

```javascript
import Database from "better-sqlite3";
const db = new Database(process.env.DATABASE_URL || "./data/app.db");
```

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

Verify: `sqlite3 data/app.db ".schema workouts"`

## 2. Swap GET to SQL

```javascript
app.get("/workouts", (req, res) => {
  const rows = db.prepare("SELECT * FROM workouts").all();
  res.json({ data: rows });
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
res.status(201).json({ data: created });
```

After curl POST, run `SELECT * FROM workouts` — confirm row and `created_at`.

Commit: `feat: persist workouts on create`.

## 4. Prove persistence

1. curl POST a workout
2. Restart the API
3. curl GET — data still there
4. DB Browser shows the same row

## 5. Optional: GET by id

Add `GET /workouts/:id`. Return `404` with `{ error: { code, message } }` when no row matches.

## Outcome

API reads/writes SQLite with timestamps. Same URLs and envelope as Stage 4; storage is real. Stage 6 connects your frontend with fetch.
