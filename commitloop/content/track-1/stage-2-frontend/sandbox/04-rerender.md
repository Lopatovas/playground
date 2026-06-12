## Re-render after data changes

```javascript
workouts.push(newWorkout);
renderWorkouts(); // don't forget this
```

Data and DOM stay in sync only when you explicitly update the display after every mutation.
