## What the user actually sees

The **frontend** is everything the user interacts with: buttons, forms, lists, colors, layout. In a web app that's HTML (structure), CSS (style), and JavaScript (behavior).

Your job as a frontend developer is not to "make it pretty" first — it's to **present data** and **capture intent** (clicks, typed text, form submissions).

```text
User  →  sees HTML on screen  →  clicks / types  →  JavaScript reacts
```

The frontend does not own permanent storage. That's fine. You can build a convincing screen before any server exists.

## HTML: structure

HTML defines what elements exist:

```html
<h1>My Workouts</h1>
<ul id="workout-list"></ul>
<form id="add-form">
  <input name="name" placeholder="Workout name" required />
  <input name="duration_min" type="number" placeholder="Minutes" required />
  <button type="submit">Add</button>
</form>
```

Give elements **ids** or **classes** so JavaScript can find them.

## JavaScript: behavior

JavaScript wires up interactivity:

```javascript
document.querySelector("#add-form").addEventListener("submit", (event) => {
  event.preventDefault();
  // read form, update data, re-render
});
```

## Why start here

Building the UI first lets you focus on one problem: **does this screen make sense to a human?** You won't debug CORS, SQL, or server ports at the same time. Those layers come in Stages 3 and 4.
