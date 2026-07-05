## Mock data = pretend backend

Before you have an API, keep your list in a **JavaScript array** in the browser:

```javascript
let workouts = [
  { id: 1, name: "Morning run", duration_min: 30 },
  { id: 2, name: "Yoga", duration_min: 45 },
];
```

This is **mock data**. It lets you build and test UI logic without a server.

## Generating ids locally

Real databases auto-generate ids. For mock data, pick something simple:

```javascript
const id = Date.now(); // good enough for one user, one tab
```

When Stage 5 connects SQLite, the database will assign ids instead.

## Separate "data access" from rendering

Structure your code so swapping mock data for an API is a small change:

```javascript
function getWorkouts() {
  return workouts;
}

function addWorkout(name, durationMin) {
  workouts.push({ id: Date.now(), name, duration_min: durationMin });
}

function renderWorkouts() {
  const data = getWorkouts();
  // ... update DOM from data
}
```

Your `renderWorkouts()` function shouldn't care where data came from. Stage 6 rewrites `getWorkouts()` and `addWorkout()` to use `fetch()` — the render function stays.

## What mock data cannot do

- **Persist** across page refresh (data is gone)
- **Share** between users or devices
- **Enforce** rules on the server

That's why mock data is a stepping stone. Stage 4 adds the API; Stage 5 adds real persistence; Stage 6 wires the UI to the API.

## Your CRUD loop

Create and Read are enough for this stage:

```text
Load array → render list → user submits form → push to array → re-render
```

Debug each step in Console. The full stack connects in later stages.
