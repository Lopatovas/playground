## One function, too many hats

Imagine a route handler that:

1. Parses `req.body`
2. Checks `duration_min > 0`
3. Runs `INSERT INTO workouts ...`
4. Formats the JSON response

It works. But where should step 2 live when you add `PUT /workouts/:id` and need the same rule again?

Think about **separation of concerns** — each layer with one job.
