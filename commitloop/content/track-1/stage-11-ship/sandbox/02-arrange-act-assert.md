## Three steps

```javascript
const errors = validateWorkout({ name: "", duration_min: 30 });
expect(errors).toContain("name is required");
```

Which part is the assert?
