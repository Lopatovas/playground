## Three layers, three jobs

A maintainable API splits work into layers. Each layer has **one reason to change**:

```text
Request
   ↓
┌─────────────┐
│   Routes    │  HTTP: parse request, pick status code, send response
├─────────────┤
│  Services   │  Business logic: rules, validation, orchestration
├─────────────┤
│    Data     │  Storage: SQL queries, database access
└─────────────┘
   ↓
Database
```

### Routes (thin)

Route handlers should be **thin**. They:

- Read `req.params`, `req.body`, `req.query`
- Call a service function
- Map the result (or error) to an HTTP response

```javascript
app.post("/workouts", async (req, res) => {
  try {
    const workout = await workoutService.create(req.body);
    res.status(201).json(workout);
  } catch (err) {
    if (err.status === 400) return res.status(400).json({ error: err.message });
    throw err;
  }
});
```

### Services (business logic)

The service layer holds **rules** — what is allowed, what is not:

```javascript
// workout.service.js
export function createWorkout(data) {
  const errors = validateWorkout(data);
  if (errors.length > 0) {
    const err = new Error(errors.join(", "));
    err.status = 400;
    throw err;
  }
  return workoutRepo.insert(data);
}
```

Services don't know about `req` or `res`. That makes them **testable without HTTP**.

### Data layer (storage)

The data layer (sometimes called repository) only talks to the database:

```javascript
// workout.repo.js
export async function insert({ name, duration_min }) {
  const result = await db.run(
    "INSERT INTO workouts (name, duration_min) VALUES (?, ?)",
    [name, duration_min],
  );
  return db.get("SELECT * FROM workouts WHERE id = ?", [result.lastID]);
}
```

Change SQLite to Postgres later? You mostly touch this layer.

## Folder structure that scales

```text
api/
  src/
    routes/
      workouts.routes.js
    services/
      workout.service.js
    data/
      workout.repo.js
    db.js
    app.js
```

You don't need every file on day one. Start by **extracting** logic out of your Stage 4 route handlers — one layer at a time.

## The smell to watch for

If a route handler contains SQL strings **and** validation **and** response formatting, it's doing too much. Extract until each file has a name that matches its single job.
