## fetch returns a Response

```javascript
const res = await fetch(url);
const data = await res.json();
```

Check `res.ok` before parsing — a 404 still returns a body you need to handle.
