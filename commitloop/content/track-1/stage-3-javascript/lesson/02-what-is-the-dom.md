## The DOM: browser's live page tree

When the browser loads HTML, it builds the **DOM** (Document Object Model) — a tree of elements in memory. JavaScript reads and updates this tree to change what the user sees **without** a full page reload.

```javascript
document.querySelector("#workout-list").innerHTML = "<li>Hello</li>";
```

That line finds an element by id and replaces its contents. Open **Elements** in DevTools — you'll see the new `<li>` appear.

## Finding elements

`querySelector` returns the first match:

```javascript
const list = document.querySelector("#workout-list");
const form = document.querySelector("#add-form");
```

Use **ids** in your HTML so JavaScript can find the right nodes:

```html
<ul id="workout-list"></ul>
<form id="add-form">…</form>
```

## JavaScript's job on the frontend

The frontend **presents data** and **captures intent** (clicks, typed text, form submissions). It does not own permanent storage — that's fine for now.

```text
User  →  sees DOM on screen  →  clicks / types  →  JavaScript reacts
```

Stage 2 gave you HTML structure and CSS layout. This stage adds **behavior**: wiring up interactivity with JavaScript.

## Why the DOM matters

Data in a JavaScript array and what the user sees are **separate**. Changing the array does nothing on screen until you update the DOM. Every render function you'll write exists to keep those two in sync.
