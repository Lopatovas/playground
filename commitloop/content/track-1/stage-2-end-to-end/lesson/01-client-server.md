## Two computers having a conversation

Almost every app you use is two programs talking:

- The **client** (a browser, a mobile app) — what the user sees and touches.
- The **server** (your Express app) — where data lives and rules are enforced.

They talk over **HTTP**, a request/response protocol. The client sends a **request**; the server sends back a **response**. That's the whole game.

```text
Client                         Server
  │   GET /workouts             │
  │ ──────────────────────────▶ │
  │                             │  (look up data)
  │   200 OK  + JSON body       │
  │ ◀────────────────────────── │
```

## Anatomy of a request

Every HTTP request has:

- a **method** (what you want to do)
- a **path** (which resource)
- optional **headers** (metadata, like content type)
- an optional **body** (data you're sending, e.g. on a POST)

The method tells the server your intent:

| Method | Intent | Example |
| --- | --- | --- |
| `GET` | Read data | `GET /workouts` |
| `POST` | Create something | `POST /workouts` |
| `PUT` / `PATCH` | Update something | `PATCH /workouts/12` |
| `DELETE` | Remove something | `DELETE /workouts/12` |

`GET` should never change data — it's safe to repeat. Creating happens with `POST`.

## Anatomy of a response

The server answers with a **status code** and usually a **body** (JSON, for an API).

Status codes come in families:

| Range | Meaning | Common ones |
| --- | --- | --- |
| `2xx` | Success | `200 OK`, `201 Created` |
| `4xx` | Client did something wrong | `400 Bad Request`, `404 Not Found` |
| `5xx` | Server failed | `500 Internal Server Error` |

Returning the *right* status is part of building a good API: `201` when you create, `404` when something doesn't exist, `400` when the client sends garbage.

## REST in one paragraph

**REST** is a style for organizing an API around **resources** (nouns) addressed by URLs, manipulated with HTTP methods. A "workouts" resource gives you `GET /workouts` (list), `POST /workouts` (create), `GET /workouts/:id` (one), and so on. It's predictable, and that predictability is the point.
