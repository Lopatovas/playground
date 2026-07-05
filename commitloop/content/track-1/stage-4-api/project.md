Build the **API layer** with in-memory storage. Test every endpoint with **curl** — no UI wiring yet (that's Stage 6).

## 1. Set up Express in `api/`

```bash
cd api
npm init -y
npm install express cors dotenv
```

Create a minimal server on port from `process.env.PORT || 3001` with middleware chain:

```javascript
app.use(cors({ origin: "http://localhost:3000" }));
app.use(express.json());
app.use((req, res, next) => {
  console.log(req.method, req.path);
  next();
});
```

Add `.env.example` with `PORT=3001` and `DATABASE_URL=./data/app.db`. Gitignore `.env`.

Commit: `feat: scaffold Express API with middleware`.

## 2. In-memory store

```javascript
let workouts = [{ id: 1, name: "Morning run", duration_min: 30 }];
let nextId = 2;
```

## 3. GET /workouts

Return `{ data: workouts }` with status 200. Test:

```bash
curl http://localhost:3001/workouts
```

Commit: `feat: add GET /workouts`.

## 4. POST /workouts

Validate input. On success return `201` with `{ data: created }`. On bad input return `400` with `{ error: { code, message } }`.

```bash
curl -X POST http://localhost:3001/workouts \
  -H "Content-Type: application/json" \
  -d '{"name":"Evening walk","duration_min":25}'
```

Commit: `feat: add POST /workouts with validation`.

## 5. Prove in-memory limits

Restart the API. curl GET — data is **gone**. Document that in a comment or README note. Stage 5 fixes this.

## Outcome

A working REST API with structured responses, middleware, and env config — verified with curl. Stage 5 adds SQLite; Stage 6 connects your Stage 3 UI.
