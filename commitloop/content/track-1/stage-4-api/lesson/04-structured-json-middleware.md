## Structured JSON responses

Don't return ad-hoc shapes. Use a **consistent envelope** so clients always know where to look:

```javascript
// Success
res.json({ data: workouts });

// Error
res.status(400).json({
  error: { code: "VALIDATION_ERROR", message: "name is required" },
});
```

Same pattern in every stack — ASP.NET, Spring, Express. The field names may differ; the idea doesn't.

## Why envelopes matter

Without structure, one endpoint returns `[{...}]`, another returns `{ items: [...] }`, errors are plain strings. Frontend code becomes fragile.

Pick one shape for this project and stick to it:

| Outcome | Shape |
| --- | --- |
| Success | `{ data: ... }` |
| Error | `{ error: { code, message } }` |

Stage 6's `fetch` code reads `response.data` — predictable every time.

## Middleware: request pipeline

Every HTTP request passes through a **chain** before your route handler runs. In Express, **middleware** functions sit in that chain:

```text
Request → cors → json parser → logger → route handler → Response
```

```javascript
app.use(cors({ origin: "http://localhost:3000" }));
app.use(express.json()); // parse body → req.body
app.use((req, res, next) => {
  console.log(req.method, req.path);
  next(); // pass to next middleware
});
```

Same concept exists elsewhere:

- ASP.NET: middleware pipeline
- Java Spring: filters and interceptors
- Python Flask: `@app.before_request`

Express `app.use()` is the JavaScript implementation of a universal idea.

## Order matters

`express.json()` must run **before** POST handlers that read `req.body`. Logger middleware should run early so you see every request.

If `req.body` is `undefined`, check middleware order before blaming the route.
