## Server-side array as temporary DB

In Stage 2 your array lived in the browser. Now it lives in the API process:

```javascript
let workouts = [];
let nextId = 1;
```

GET returns a copy (or the array); POST pushes a new item. Same CRUD logic, different machine.

## Why in-memory first

A real database adds SQL, files, migrations, and connection handling. Learning HTTP + Express **at the same time** as SQLite is two hard problems at once.

In-memory storage lets you focus on:

- Routes and status codes
- `req.body` parsing
- CORS and `fetch` from the UI

Stage 4 replaces the array with queries — the route handlers barely change shape.

## The limitation you must feel

**Restart the server → data disappears.**

That's not a bug. RAM clears when the process exits. Run this experiment on purpose after your slice works. The pain motivates Stage 4.

## Don't skip validation

Even with in-memory storage, check `req.body`:

```javascript
if (!name || typeof duration_min !== "number") {
  return res.status(400).json({ error: "name and duration_min required" });
}
```

Bad input should get `400`, not a corrupted array.
