## The frontend's job

The frontend turns data into something a human can see and interact with. For this first slice you can use plain HTML + JavaScript; in Stage 3 and beyond you'll move to React. The *concepts* are identical: **fetch data, render it, send changes back**.

## Fetching data

The browser's `fetch` makes HTTP requests. It's asynchronous — it returns a **promise** — so we use `async/await`:

```javascript
async function loadWorkouts() {
  const res = await fetch("http://localhost:3001/workouts");
  if (!res.ok) {
    throw new Error("Failed to load workouts");
  }
  const workouts = await res.json();
  return workouts;
}
```

- `await fetch(...)` waits for the response.
- `res.ok` is `true` for 2xx status codes — always check it.
- `await res.json()` parses the JSON body (it's also async).

## Rendering a list

Once you have the data, put it on the page:

```javascript
const list = document.querySelector("#workout-list");
const workouts = await loadWorkouts();

list.innerHTML = workouts
  .map((w) => `<li>${w.name} — ${w.duration_min} min</li>`)
  .join("");
```

In React this becomes `workouts.map(w => <li key={w.id}>...</li>)` — same idea, nicer ergonomics.

## Sending data with a form

To create a record, send a `POST` with a JSON body:

```javascript
async function createWorkout(name, durationMin) {
  const res = await fetch("http://localhost:3001/workouts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, duration_min: durationMin }),
  });
  return res.json();
}
```

Three required pieces for a POST:

1. `method: "POST"`
2. the `Content-Type: application/json` header
3. a `body` that's a JSON **string** (`JSON.stringify`)

After creating, re-fetch the list (or add the returned item) so the UI reflects reality.

## Handle the unhappy paths

Real networks fail. Show the user what's happening:

```javascript
try {
  const workouts = await loadWorkouts();
  render(workouts);
} catch (err) {
  showError("Couldn't load workouts. Is the API running?");
}
```

Loading and error states aren't optional polish — they're part of a working app. You'll formalize them in Stage 3.
