## Never trust the client

Your frontend form checks that `name` is not empty. Good — that gives instant feedback.

But the frontend is **not** a security boundary. Anyone can:

- Open DevTools and remove the `required` attribute
- Call your API with `curl` or Postman
- Write a script that sends garbage data

```bash
curl -X POST http://localhost:3001/workouts \
  -H "Content-Type: application/json" \
  -d '{"name":"","duration_min":-5}'
```

If your server blindly inserts that row, you have a bug — no matter how nice the form looks.

## Validate on the server, always

The server is the **real gate**. Every write endpoint should check:

1. **Required fields** — is `name` present and non-empty?
2. **Types** — is `duration_min` actually a number?
3. **Business rules** — is `duration_min` positive?

If validation fails, return **400 Bad Request** with a clear message:

```json
{ "error": "name is required" }
```

| Status | Meaning |
| --- | --- |
| **400** | Client sent bad data — fix the request |
| **404** | Resource doesn't exist |
| **201** | Created successfully |
| **500** | Server broke — not the client's fault |

Never return 500 for bad input. That tells the user *you* are broken when *they* sent junk.

## A simple validation pattern

```javascript
function validateWorkout(body) {
  const errors = [];

  if (!body.name || typeof body.name !== "string" || !body.name.trim()) {
    errors.push("name is required");
  }
  if (typeof body.duration_min !== "number" || body.duration_min <= 0) {
    errors.push("duration_min must be a positive number");
  }

  return errors;
}

// In your route handler:
const errors = validateWorkout(req.body);
if (errors.length > 0) {
  return res.status(400).json({ errors });
}
```

Later you'll use libraries like **Zod** for this (CommitLoop itself does). The principle is the same: reject bad input early, before it touches the database.

## Frontend validation still matters

Server validation is non-negotiable. Frontend validation is for **UX** — catching mistakes before a round trip to the server.

Do both. Trust neither alone.
