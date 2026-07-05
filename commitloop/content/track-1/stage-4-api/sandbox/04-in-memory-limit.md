## RAM is volatile

```javascript
let workouts = []; // lives in the Node process
```

Kill the process → array is gone. Stage 5 moves this data to a file on disk.

Run the experiment: create records, restart the server, curl GET — empty array. That's expected.
