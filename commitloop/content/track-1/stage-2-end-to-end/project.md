Build your first **vertical slice**: one entity, working from the database all the way to the screen.

Pick the main entity of your project (workouts, recipes, transactions, books…). Everything below uses `workouts` as the example — substitute your own.

## 1. Set up the database

Add a database to your `api/`. SQLite is the easiest start — a single file, no server. Create one table for your entity:

```sql
CREATE TABLE workouts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  duration_min INTEGER NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

Commit it: `feat: add workouts table`.

## 2. Build the read endpoint

In Express, add `GET /workouts` that selects all rows and returns them as JSON. Test it in your browser or with `curl`:

```bash
curl http://localhost:3001/workouts
```

Commit: `feat: add GET /workouts endpoint`.

## 3. Build the create endpoint

Add `POST /workouts` that reads `req.body`, inserts a row (use a **parameterized query**), and responds `201` with the created record. Remember `app.use(express.json())` and CORS.

```bash
curl -X POST http://localhost:3001/workouts \
  -H "Content-Type: application/json" \
  -d '{"name":"Morning run","duration_min":30}'
```

Commit: `feat: add POST /workouts endpoint`.

## 4. Build the frontend

In `web/`, create a page that:

- `fetch`es `GET /workouts` on load and **renders the list**
- has a **form** that `POST`s a new workout, then refreshes the list
- shows a basic **loading** and **error** state

Plain HTML/JS is fine for now. Commit as you go: `feat: list workouts on frontend`, `feat: add workout via form`.

## 5. Prove it end to end

Add a workout through the UI. Confirm it:

1. appears in the list immediately, and
2. is still there after a refresh (it's really in the database).

## Outcome

You have a running full-stack application: a database, a REST API, and a frontend that reads and writes through it. It's small — and it's real. Next stage you'll give it structure so it can grow without turning into spaghetti.
