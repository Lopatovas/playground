## Two functions, one habit

```javascript
function loadData() { return workouts; }      // will become fetch()
function render(data) { /* update DOM */ }    // stays the same
```

When Stage 3 arrives, you rewrite `loadData`. `render` doesn't need to know about HTTP.
