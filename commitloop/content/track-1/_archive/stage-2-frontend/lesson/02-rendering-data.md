## Data and display are separate

Your app has **data** (a list of workouts) and **display** (the HTML the user sees). They are not automatically linked. Change the array and nothing happens on screen until you **re-render**.

```javascript
let workouts = [
  { id: 1, name: "Morning run", duration_min: 30 },
];

function renderWorkouts() {
  const list = document.querySelector("#workout-list");
  list.innerHTML = workouts
    .map((w) => `<li>${w.name} — ${w.duration_min} min</li>`)
    .join("");
}

renderWorkouts(); // call once on load
```

## Mapping data to HTML

The pattern is always the same:

1. Start with an array of objects
2. Transform each object into an HTML string
3. Join and assign to an element's `innerHTML` (or create DOM nodes)

In React you'll write `workouts.map(w => <li key={w.id}>…</li>)` — same idea, nicer syntax. Learn the plain-JS version first.

## Empty states matter

If `workouts.length === 0`, don't show a blank `<ul>`. Tell the user what to do:

```javascript
if (workouts.length === 0) {
  list.innerHTML = "<p>No workouts yet. Add one below.</p>";
  return;
}
```

An empty state is part of a complete UI, not polish you add later.

## Keep render logic isolated

Put list rendering in one function. When data changes — add, delete, edit — call that function again. This habit pays off in Stage 3 when data comes from `fetch()` instead of a local array.
