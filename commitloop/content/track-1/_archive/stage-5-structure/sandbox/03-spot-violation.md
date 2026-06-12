## The 80-line route handler

```javascript
app.post("/workouts", async (req, res) => {
  const { name, duration_min } = req.body;
  if (!name) return res.status(400).json({ error: "name required" });
  if (duration_min <= 0) return res.status(400).json({ error: "bad duration" });
  const result = await db.run(
    "INSERT INTO workouts (name, duration_min) VALUES (?, ?)",
    [name, duration_min],
  );
  const row = await db.get("SELECT * FROM workouts WHERE id = ?", [result.lastID]);
  res.status(201).json(row);
});
```

For a tutorial, this is fine. For a growing app, it's a **layering smell**.

What's the core problem with keeping it this way?
