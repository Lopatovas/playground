On the frontend, `fetch` returns a **Response** object — not your data directly. You have to read the body, and that read is itself asynchronous.

```javascript
const res = await fetch("http://localhost:3001/workouts");

if (!res.ok) {
  throw new Error(`Request failed: ${res.status}`);
}

const data = await res.json(); // parse the JSON body
console.log(data); // now it's a real array/object
```

Two awaits, two stages: first await the response, then await parsing its body. Skipping `res.json()` leaves you holding a Response, not your workouts.

For the checkpoint: which line correctly gets the parsed JSON body?
