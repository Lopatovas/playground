## CRUD maps to SQL and HTTP

| Operation | SQL | HTTP |
| --- | --- | --- |
| Create | `INSERT` | POST |
| Read | `SELECT` | GET |
| Update | `UPDATE` | PATCH |
| Delete | `DELETE` | DELETE |

```sql
INSERT INTO workouts (name, duration_min) VALUES ('Morning run', 30);
SELECT * FROM workouts;
SELECT * FROM workouts WHERE id = 2;
UPDATE workouts SET duration_min = 35 WHERE id = 1;
DELETE FROM workouts WHERE id = 2;
```

Your Stage 4 routes already spoke HTTP. Now the handlers run SQL instead of mutating an array.

## Parameterized queries

**Never** build SQL with string concatenation from user input:

```javascript
// WRONG — SQL injection risk
db.run(`INSERT INTO workouts (name) VALUES ('${name}')`);

// RIGHT
db.prepare("INSERT INTO workouts (name, duration_min) VALUES (?, ?)").run(
  name,
  duration_min,
);
```

`?` placeholders let the driver escape values safely.

## Swap in-memory for SQLite

Before:

```javascript
let workouts = [];
app.get("/workouts", (req, res) => {
  res.json({ data: workouts });
});
```

After:

```javascript
app.get("/workouts", (req, res) => {
  const rows = db.prepare("SELECT * FROM workouts").all();
  res.json({ data: rows });
});

app.post("/workouts", (req, res) => {
  const { name, duration_min } = req.body;
  const result = db
    .prepare("INSERT INTO workouts (name, duration_min) VALUES (?, ?)")
    .run(name, duration_min);
  const created = db
    .prepare("SELECT * FROM workouts WHERE id = ?")
    .get(result.lastInsertRowid);
  res.status(201).json({ data: created });
});
```

Delete `let workouts` and `nextId`. Run `SELECT * FROM workouts` after every POST.

## Return the created row

After INSERT, fetch the row by id and return it as JSON — same `{ data: ... }` envelope from Stage 4, now with `created_at` included.

## Prove persistence

1. curl POST a workout
2. `SELECT * FROM workouts` — row exists
3. Kill and restart the API
4. curl GET — same data

If step 4 fails, you're still on in-memory storage somewhere.
