## Two functions, one habit

```javascript
function getWorkouts() { return workouts; }     // will become fetch() in Stage 6
function renderWorkouts() { /* update DOM */ }  // stays the same
```

When the API arrives, you rewrite data access. Render doesn't need to know about HTTP.
