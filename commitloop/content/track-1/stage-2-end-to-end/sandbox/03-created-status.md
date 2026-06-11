Status codes are how your API communicates outcomes. Returning the right one is part of correctness, not decoration.

```javascript
app.post("/workouts", async (req, res) => {
  const created = await insertWorkout(req.body);
  res.status(201).json(created); // 201 = a new resource was created
});
```

Quick reference for the codes you'll use most:

| Code | Meaning | When |
| --- | --- | --- |
| `200 OK` | Success | Reads and updates |
| `201 Created` | Resource created | Successful POST |
| `400 Bad Request` | Bad client input | Validation failed |
| `404 Not Found` | Doesn't exist | Unknown id |
| `500 Server Error` | Server blew up | Unhandled exception |

For the checkpoint: a POST just created a workout — which code do you return?
