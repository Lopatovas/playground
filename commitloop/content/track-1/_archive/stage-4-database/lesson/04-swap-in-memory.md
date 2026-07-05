## Surgical swap

Your Stage 3 API probably looks like:

```javascript
let workouts = [];

app.get("/workouts", (req, res) => {
  res.json(workouts);
});

app.post("/workouts", (req, res) => {
  const created = { id: nextId++, ...req.body };
  workouts.push(created);
  res.status(201).json(created);
});
```

Replace the array operations:

```javascript
app.get("/workouts", (req, res) => {
  const rows = db.prepare("SELECT * FROM workouts").all();
  res.json(rows);
});

app.post("/workouts", (req, res) => {
  const { name, duration_min } = req.body;
  const result = db
    .prepare("INSERT INTO workouts (name, duration_min) VALUES (?, ?)")
    .run(name, duration_min);
  const created = db
    .prepare("SELECT * FROM workouts WHERE id = ?")
    .get(result.lastInsertRowid);
  res.status(201).json(created);
});
```

Delete `let workouts` and `nextId`. Run the persistence test.

## .gitignore the db file?

Often yes for local dev (`*.db`), or commit an empty seeded db for demos — pick one approach and document it in your README.

## Frontend unchanged

If JSON shapes match, the UI needs zero changes. That's the payoff of stable API contracts.
