Build the **API layer** and **connect your Stage 2 UI** to it. Data lives in an **in-memory array** on the server — no database yet.

## 1. Set up Express in `api/`

```bash
cd api
npm init -y
npm install express cors
```

Create a minimal server on port 3001 with `express.json()` and CORS for `http://localhost:3000`.

Commit: `feat: scaffold Express API`.

## 2. In-memory store

```javascript
let workouts = [
  { id: 1, name: "Morning run", duration_min: 30 },
];
let nextId = 2;
```

This replaces your frontend mock array — but on the **server**.

## 3. GET /workouts

Return the array as JSON with status 200. Test with curl:

```bash
curl http://localhost:3001/workouts
```

Commit: `feat: add GET /workouts`.

## 4. POST /workouts

Read `req.body`, push to the array, respond `201` with the created object:

```bash
curl -X POST http://localhost:3001/workouts \
  -H "Content-Type: application/json" \
  -d '{"name":"Evening walk","duration_min":25}'
```

Commit: `feat: add POST /workouts`.

## 5. Wire the frontend

Refactor `web/` to use `fetch` instead of a local array:

- `getWorkouts()` → `fetch("http://localhost:3001/workouts")`
- `addWorkout()` → `fetch(..., { method: "POST", ... })`
- Keep your render functions — only the data layer changes

Add basic loading/error handling. Commit: `feat: connect frontend to API`.

## 6. Prove the connection

1. Add a workout through the UI — it appears in the list
2. `curl` the GET endpoint — same data
3. Restart the API — data is **gone** (in-memory). That's expected until Stage 4.

## Outcome

UI → API works. Persistence comes next.
