## Three beats

```javascript
// Arrange
const input = { name: "", duration_min: 5 };

// Act
const errors = validateWorkout(input);

// Assert
expect(errors.length).toBeGreaterThan(0);
```

Which step checks your expectation?
