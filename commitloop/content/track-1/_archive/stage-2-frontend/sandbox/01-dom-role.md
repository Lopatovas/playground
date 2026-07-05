## The DOM

When the browser loads your HTML, it builds the **DOM** (Document Object Model) — a tree of elements in memory. JavaScript reads and updates this tree to change what the user sees.

```javascript
document.querySelector("#workout-list").innerHTML = "<li>Hello</li>";
```

That line finds an element by id and replaces its contents. The user sees "Hello" without reloading the page.
