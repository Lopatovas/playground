## Middleware runs before handlers

```javascript
app.use(express.json());
app.post("/workouts", (req, res) => { /* uses req.body */ });
```

If `express.json()` is missing or comes **after** the route, `req.body` is `undefined` on POST.

Same for your response envelope — always return `{ data: ... }` on success, `{ error: { code, message } }` on failure.
