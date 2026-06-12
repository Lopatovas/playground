## Events: when the user acts

Browsers fire **events** when things happen: clicks, key presses, form submits. You listen with `addEventListener`:

```javascript
const form = document.querySelector("#add-form");

form.addEventListener("submit", (event) => {
  event.preventDefault(); // critical — see below
  const name = form.name.value.trim();
  const durationMin = Number(form.duration_min.value);
  // ... add to array, re-render
});
```

## Always prevent default on forms

By default, submitting a form **reloads the entire page**. That wipes your JavaScript state. `event.preventDefault()` stops that so your code stays in control.

If you add a workout and the page flashes white, you forgot this line.

## Reading form values

- `form.name.value` — text from an input with `name="name"`
- `Number(...)` — convert strings to numbers for numeric fields
- `.trim()` — strip accidental spaces from text

Validate before adding:

```javascript
if (!name || durationMin <= 0) {
  alert("Name and positive duration required");
  return;
}
```

Client-side validation is for **fast feedback**. The API will enforce rules again in Stage 3 — never trust the browser alone in production.

## After submit: reset and re-render

```javascript
workouts.push({ id: Date.now(), name, duration_min: durationMin });
form.reset();
renderWorkouts();
```

The user sees the new item immediately. That's the core loop of any CRUD UI.
