## Express: routes map requests to code

**Express** is a minimal web framework for Node. You define **routes** — pairs of (method + path) — and give each a handler function that builds a response.

```javascript
import express from "express";

const app = express();
app.use(express.json()); // parse JSON request bodies

app.get("/workouts", (req, res) => {
  res.json([{ id: 1, name: "Morning run" }]);
});

app.listen(3001, () => console.log("API on http://localhost:3001"));
```

`app.use(express.json())` is essential — without it, `req.body` is undefined for POST requests.

## A read endpoint

A `GET` handler queries the database and sends the rows back as JSON:

```javascript
app.get("/workouts", async (req, res) => {
  const workouts = await db.all("SELECT * FROM workouts");
  res.json(workouts);
});
```

`res.json(...)` serializes the value to JSON and sets the right headers. The default status is `200 OK`.

## A create endpoint

A `POST` handler reads the request body, inserts a row, and returns the created resource with `201`:

```javascript
app.post("/workouts", async (req, res) => {
  const { name, duration_min } = req.body;
  const result = await db.run(
    "INSERT INTO workouts (name, duration_min) VALUES (?, ?)",
    [name, duration_min],
  );
  const created = await db.get("SELECT * FROM workouts WHERE id = ?", [
    result.lastID,
  ]);
  res.status(201).json(created);
});
```

Two things to notice:

- We read fields off `req.body` (the JSON the client sent).
- We use **parameterized queries** (`?` placeholders), never string concatenation. This prevents **SQL injection**, where a malicious value rewrites your query. Always parameterize user input.

## Route parameters

`:id` in a path captures a value:

```javascript
app.get("/workouts/:id", async (req, res) => {
  const workout = await db.get("SELECT * FROM workouts WHERE id = ?", [
    req.params.id,
  ]);
  if (!workout) {
    return res.status(404).json({ error: "Workout not found" });
  }
  res.json(workout);
});
```

Returning `404` for a missing record is the difference between a sloppy API and a correct one.

## CORS: letting the browser through

Your frontend (port 3000) and API (port 3001) are different **origins**. Browsers block cross-origin requests unless the server opts in with **CORS** headers. In Express:

```javascript
import cors from "cors";
app.use(cors({ origin: "http://localhost:3000", credentials: true }));
```

Forget this and your frontend's `fetch` calls fail with a CORS error in the console — a rite of passage for every web developer.
