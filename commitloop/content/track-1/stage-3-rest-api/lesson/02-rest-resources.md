## REST: resources + HTTP methods

**REST** organizes an API around **resources** (nouns) at URLs, manipulated with HTTP methods:

```text
GET    /workouts       → list all
POST   /workouts       → create one
GET    /workouts/:id   → one record
PATCH  /workouts/:id   → update
DELETE /workouts/:id   → remove
```

Predictable URLs make frontends and tools easy to write.

## JSON on the wire

APIs speak **JSON** — structured text both JavaScript and servers understand:

```json
{ "name": "Morning run", "duration_min": 30 }
```

The client sends JSON in the request body; the server sends JSON in the response. `Content-Type: application/json` tells both sides what format to expect.

## Your slice for this stage

You need two endpoints to replace Stage 2's mock data:

- `GET /workouts` — frontend loads the list
- `POST /workouts` — frontend creates a record

That's a minimal but real API contract. Stage 4 swaps what's behind the handlers; the URLs stay the same.
