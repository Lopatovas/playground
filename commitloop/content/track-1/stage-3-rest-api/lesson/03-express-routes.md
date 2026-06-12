## Express in five lines

```javascript
import express from "express";
import cors from "cors";

const app = express();
app.use(cors({ origin: "http://localhost:3000" }));
app.use(express.json());

app.get("/workouts", (req, res) => {
  res.json(workouts);
});

app.listen(3001, () => console.log("API on :3001"));
```

- `app.use(express.json())` — parses JSON bodies into `req.body`. Without it, POST bodies are `undefined`.
- `cors(...)` — allows your frontend on a different port to call the API.
- `res.json(...)` — sends JSON with the right headers.

## POST handler

```javascript
app.post("/workouts", (req, res) => {
  const { name, duration_min } = req.body;
  const created = { id: nextId++, name, duration_min };
  workouts.push(created);
  res.status(201).json(created);
});
```

Read from `req.body`, mutate the store, return `201 Created` with the new object.

## Test without the UI

Use **curl** or the browser address bar (GET only) to verify the API before wiring fetch:

```bash
curl http://localhost:3001/workouts
```

Isolate layers when debugging: if curl works but the UI doesn't, the bug is in the frontend.
