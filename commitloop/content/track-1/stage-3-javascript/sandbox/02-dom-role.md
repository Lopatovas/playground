## The DOM

When the browser loads your HTML, it builds the **DOM** — a tree of elements in memory. JavaScript reads and updates this tree to change what the user sees.

```javascript
document.querySelector("#workout-list").innerHTML = "<li>Hello</li>";
```

Open **Elements** in DevTools — confirm the `<li>` appears under your list container.
