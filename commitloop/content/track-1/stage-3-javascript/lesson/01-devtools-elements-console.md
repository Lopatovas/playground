## Chrome DevTools: your browser debugger

Before you write DOM code, learn the tool you'll use to **verify** it. Open DevTools:

- **Mac:** `Cmd + Option + I`
- **Windows/Linux:** `F12` or `Ctrl + Shift + I`

Two tabs matter most in this stage:

| Tab | Use it to… |
| --- | --- |
| **Elements** | Inspect HTML structure, see ids/classes, watch the DOM change live |
| **Console** | Run JavaScript, read errors, log values with `console.log` |

## Elements: see the live page

Right-click any element → **Inspect**. The Elements panel highlights that node in the tree.

Try this on your project page:

1. Find your list container (`#workout-list` or similar)
2. Watch its `innerHTML` change when your render function runs
3. Edit an attribute in Elements — the page updates instantly (until refresh)

Elements proves whether your JavaScript actually changed the DOM.

## Console: check your data

The Console runs JavaScript in the page context:

```javascript
document.querySelector("#workout-list");
console.log(workouts); // if your array is in scope
```

Add `console.log` in your code while building:

```javascript
function renderWorkouts() {
  console.log("rendering", workouts.length, "items");
  // ... update DOM
}
```

When the list looks wrong, check Console first — errors appear in red, logs show what your code saw.

## The debug loop

```text
Write JS → refresh page → check Console for errors → inspect Elements → fix → repeat
```

Every sandbox step in this stage should be confirmable in DevTools. If you can't see it in Elements or Console, you can't trust it yet.
