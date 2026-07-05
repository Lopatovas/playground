## Two programs, one conversation

Almost every app is two programs talking:

- The **client** (browser) — what the user sees
- The **server** (Express) — where rules are enforced and data is held

They communicate over **HTTP**: the client sends a **request**, the server sends a **response**.

```text
Browser :3000              API :3001
  │   GET /workouts             │
  │ ──────────────────────────▶ │
  │   200 OK  + JSON body       │
  │ ◀────────────────────────── │
```

Your Stage 3 UI uses mock data in the browser. This stage builds the **server side** — you'll wire the UI in Stage 6.

## Request anatomy

| Part | Example |
| --- | --- |
| Method | `GET`, `POST`, `PATCH`, `DELETE` |
| Path | `/workouts`, `/workouts/3` |
| Headers | `Content-Type: application/json` |
| Body | JSON on POST/PATCH |

| Method | Intent |
| --- | --- |
| `GET` | Read — safe to repeat |
| `POST` | Create |
| `PATCH` | Update part of a record |
| `DELETE` | Remove |

## Response anatomy

**Status code** + optional **body** (JSON for APIs):

| Code | Meaning |
| --- | --- |
| `200` | OK |
| `201` | Created |
| `400` | Bad request (client sent garbage) |
| `404` | Not found |
| `500` | Server error |

Return the right code. `201` after create, `404` when an id doesn't exist.

## Test before you trust the UI

You'll hit endpoints with **curl** in the next lesson — before any frontend code calls them. If curl works, the API layer is solid.
