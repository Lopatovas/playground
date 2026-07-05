## Why test the API before the browser?

You built a SQLite-backed API in Stage 5. Before you wire `fetch` in the UI, prove the endpoints work **without the browser in the loop**.

Postman, Bruno, Insomnia, and `curl` send HTTP requests directly to your server. No CORS. No DOM. No JavaScript errors hiding the real problem.

**Rule:** If Postman fails, fix the API first. If Postman succeeds but the browser fails, look at CORS or frontend code.

## curl — works everywhere

```bash
curl http://localhost:3001/workouts
```

Create a row:

```bash
curl -X POST http://localhost:3001/workouts \
  -H "Content-Type: application/json" \
  -d '{"name":"Morning run","duration_min":30}'
```

`-X POST` sets the method. `-H` adds headers. `-d` sends the JSON body.

## Postman / Bruno / Insomnia — save requests

GUI clients do the same thing with buttons:

1. Create a **collection** named after your project (e.g. "Workout Tracker")
2. Add **GET /workouts** — no body, expect `200` and a JSON array
3. Add **POST /workouts** — JSON body, `Content-Type: application/json`, expect `201`

Save the collection in your repo (`docs/api-collection.json` or `requests.http`) so you can re-run tests after every change.

## What to verify

| Request | Expect |
| --- | --- |
| GET /workouts | `200`, JSON array (maybe empty) |
| POST /workouts | `201`, JSON object with `id` |
| GET /workouts after POST | New row appears |
| Restart API, GET again | Data still there (SQLite) |

## When something fails

| Status | Likely cause |
| --- | --- |
| Connection refused | API not running or wrong port |
| 404 | Wrong URL path |
| 500 | Check server logs — SQL error, missing column |
| 400 | Validation rejected the body |

Server **logs** and Postman **response body** tell you which layer broke. Fix it here before opening DevTools.
