Build the **frontend first** — a page that lists and creates records using **mock data in the browser**. No API, no database, no `fetch` yet.

Pick your project's main entity (workouts, recipes, transactions…). Examples use `workouts`.

## 1. Set up `web/`

In your repo's `web/` folder, create a minimal static page you can open in the browser (plain HTML + JS, or a tiny Vite app — your choice).

```bash
# example: open web/index.html in the browser, or npm run dev if you use Vite
```

Commit: `feat: scaffold web frontend`.

## 2. Mock data array

Define an in-memory array in JavaScript:

```javascript
let workouts = [
  { id: 1, name: "Morning run", duration_min: 30 },
  { id: 2, name: "Yoga", duration_min: 45 },
];
```

This is your temporary "database." It resets on page refresh — that's expected for this stage.

## 3. Render the list

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

Call it on page load.

## 4. Add via form

Add a form with fields for your entity. On submit:

1. `event.preventDefault()` — don't reload the page
2. Read values from the form
3. Push a new object onto the array (generate a simple `id`, e.g. `Date.now()`)
4. Call `renderWorkouts()` again

Commit as you go: `feat: render workout list`, `feat: add workout via form`.

## 5. Empty state

When the array is empty, show a friendly message instead of a blank page.

## Outcome

A working UI that **feels** like a real app — list, form, add — but everything lives in the browser. In Stage 3 you'll replace the array with `fetch()` calls to a real API.
