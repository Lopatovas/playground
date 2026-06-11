When you read the response status, you can tell exactly what happened without guessing.

Your frontend requests a single workout that doesn't exist:

```javascript
const res = await fetch("http://localhost:3001/workouts/999");
console.log(res.status); // 404
```

A good API returns `404` here because the row isn't in the database:

```javascript
app.get("/workouts/:id", async (req, res) => {
  const workout = await getWorkout(req.params.id);
  if (!workout) return res.status(404).json({ error: "Not found" });
  res.json(workout);
});
```

Reading the status tells you which layer to suspect: `4xx` means the request was wrong (bad input, missing resource, no permission); `5xx` means the server itself failed.

For the checkpoint: what does that `404` actually tell you?
