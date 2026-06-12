## The blank white screen

A user opens your workouts page. The API is slow. Then it errors. Then it returns an empty array.

If your component only has:

```javascript
return <ul>{workouts.map(...)}</ul>;
```

…what does the user see in each case?

List the states a data-fetching view **must** handle to feel professional.
