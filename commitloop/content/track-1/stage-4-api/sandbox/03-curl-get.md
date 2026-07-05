## curl your GET endpoint

With the API running:

```bash
curl http://localhost:3001/workouts
```

You should see JSON in the terminal. If this fails, fix the API before touching the frontend.

For POST:

```bash
curl -X POST http://localhost:3001/workouts \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","duration_min":10}'
```

Then curl GET again — the new item should appear.
