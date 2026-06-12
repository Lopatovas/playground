## Swap mock data for fetch

Keep your Stage 2 render functions. Change only how data is loaded and saved:

```javascript
async function loadWorkouts() {
  const res = await fetch("http://localhost:3001/workouts");
  if (!res.ok) throw new Error("Failed to load");
  return res.json();
}

async function createWorkout(name, durationMin) {
  const res = await fetch("http://localhost:3001/workouts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, duration_min: durationMin }),
  });
  if (!res.ok) throw new Error("Failed to create");
  return res.json();
}
```

Three required pieces for POST: `method`, `Content-Type` header, `JSON.stringify` body.

## Page load flow

```javascript
async function init() {
  try {
    const workouts = await loadWorkouts();
    renderWorkouts(workouts);
  } catch (err) {
    showError("Couldn't load workouts. Is the API running?");
  }
}
init();
```

## After form submit

```javascript
await createWorkout(name, durationMin);
const workouts = await loadWorkouts(); // or append the returned item
renderWorkouts(workouts);
```

## Debugging checklist

| Symptom | Check |
| --- | --- |
| CORS error in console | API `cors` origin matches frontend URL |
| `req.body` undefined | `express.json()` + `Content-Type` header |
| Network tab shows 201 but UI empty | Did you re-render after create? |
| Connection refused | Is the API running on :3001? |

Open **Network tab** and server **logs** side by side. The failed request tells you which layer to fix.
