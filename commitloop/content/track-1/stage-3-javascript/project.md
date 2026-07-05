Add **JavaScript behavior** to your Stage 2 HTML/CSS shell — a page that lists and creates records using **mock data in the browser**. No API, no database, no `fetch` yet.

Pick your project's main entity (workouts, recipes, transactions…). Examples use `workouts`.

## 1. Mock data array

In your `web/` JavaScript, define an in-memory array:

```javascript
let workouts = [
  { id: 1, name: "Morning run", duration_min: 30 },
  { id: 2, name: "Yoga", duration_min: 45 },
];
```

This is your temporary "database." It resets on page refresh — that's expected for this stage.

Commit: `feat: add mock workout data`.

## 2. Render the list

Write a `renderWorkouts()` function that reads the array and updates the DOM:

```javascript
function renderWorkouts() {
  const list = document.querySelector("#workout-list");
  if (workouts.length === 0) {
    list.innerHTML = "<p>No workouts yet. Add one below.</p>";
    return;
  }
  list.innerHTML = workouts
    .map((w) => `<li>${w.name} — ${w.duration_min} min</li>`)
    .join("");
}
```

Call it on page load. Verify in DevTools **Elements** and **Console**.

Commit: `feat: render workout list from mock data`.

## 3. Add via form

Wire your Stage 2 form. On submit:

1. `event.preventDefault()` — don't reload the page
2. Read values from the form
3. Push a new object onto the array (generate a simple `id`, e.g. `Date.now()`)
4. Call `renderWorkouts()` again

Commit: `feat: add workout via form`.

## 4. Separate data from display

Structure with `getWorkouts()` / `addWorkout()` functions separate from `renderWorkouts()`. Stage 6 will swap the data functions for `fetch()` — render stays unchanged.

## 5. Empty state

When the array is empty, show a friendly message instead of a blank page.

## Outcome

A working UI that **feels** like a real app — list, form, add — but everything lives in the browser. Stage 4 builds the API; Stage 6 connects them.
