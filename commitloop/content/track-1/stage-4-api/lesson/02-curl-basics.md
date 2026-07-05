## curl: test APIs from the terminal

Before wiring `fetch` in the browser, prove your endpoints work with **curl** — available on Mac, Linux, and Windows.

Start your API, then:

```bash
# GET — read the list
curl http://localhost:3001/workouts

# POST — create a record
curl -X POST http://localhost:3001/workouts \
  -H "Content-Type: application/json" \
  -d '{"name":"Evening walk","duration_min":25}'
```

## Reading curl output

GET returns JSON in the terminal:

```json
[{"id":1,"name":"Morning run","duration_min":30}]
```

POST with `-v` (verbose) shows the status line:

```text
< HTTP/1.1 201 Created
```

Look for `201` after create, `200` after read.

## Why curl first

| curl works, UI doesn't | Bug is in the frontend (Stage 6) |
| curl fails | Bug is in the API — fix here |

curl removes the browser, CORS, and JavaScript from the equation. One layer at a time.

## Common flags

| Flag | Purpose |
| --- | --- |
| `-X POST` | Set HTTP method |
| `-H "Content-Type: application/json"` | Tell server body is JSON |
| `-d '{...}'` | Request body |
| `-v` | Verbose — see status code and headers |
| `-i` | Include response headers in output |

## Habit for this stage

Every route you add: **curl it before moving on**. Stage 6 adds Postman and the Network tab — same idea, richer UI.
