## Verify with Console

After your render function runs, open DevTools → **Console** and check your data:

```javascript
console.log("rendering", workouts.length, "items");
```

If the list looks empty but Console shows 3 items, the bug is in render — not the data.
