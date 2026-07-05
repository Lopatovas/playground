## Express in five lines

```javascript
import express from "express";
import cors from "cors";

const app = express();
app.use(cors({ origin: "http://localhost:3000" }));
app.use(express.json());

app.get("/workouts", (req, res) => {
  res.json({ data: workouts });
});

app.listen(3001, () => console.log("API on :3001"));
```

- `app.use(express.json())` — parses JSON bodies into `req.body`. Without it, POST bodies are `undefined`.
- `cors(...)` — allows your frontend on a different port to call the API (needed in Stage 6).
- `res.json(...)` — sends JSON with the right headers.

## POST handler

```javascript
app.post("/workouts", (req, res) => {
  const { name, duration_min } = req.body;
  if (!name || typeof duration_min !== "number") {
    return res.status(400).json({
      error: { code: "VALIDATION_ERROR", message: "name and duration_min required" },
    });
  }
  const created = { id: nextId++, name, duration_min };
  workouts.push(created);
  res.status(201).json({ data: created });
});
```

Read from `req.body`, validate, mutate the store, return `201 Created` with `{ data: ... }`.

## In-memory store

```javascript
let workouts = [{ id: 1, name: "Morning run", duration_min: 30 }];
let nextId = 2;
```

Same CRUD logic as Stage 3's browser array — but on the **server**. GET returns it; POST pushes to it.

## Test with curl

```bash
curl http://localhost:3001/workouts
curl -X POST http://localhost:3001/workouts \
  -H "Content-Type: application/json" \
  -d '{"name":"Evening walk","duration_min":25}'
```

If curl works, the API layer is done. UI wiring comes in Stage 6.

## The limitation you must feel

**Restart the server → data disappears.**

RAM clears when the process exits. Run this experiment on purpose. The pain motivates Stage 5.
