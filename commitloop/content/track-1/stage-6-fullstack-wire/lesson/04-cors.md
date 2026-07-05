## Different ports = different origins

`http://localhost:5500` (frontend) and `http://localhost:3001` (API) are **different origins**. Same hostname, different port — the browser treats them as separate sites.

## Same-origin policy

Browsers block JavaScript from reading responses across origins unless the **server explicitly allows it**. This is a security feature — random websites shouldn't silently read your bank's API.

When blocked, the console shows something like:

```text
Access to fetch at 'http://localhost:3001/workouts' from origin
'http://localhost:5500' has been blocked by CORS policy
```

**Important:** Postman and curl are not browsers. They ignore CORS. That's why you test the API with Postman first, then hit CORS when wiring the UI.

## Fix on the API (Express)

Install the `cors` package:

```bash
npm install cors
```

```javascript
import cors from "cors";

app.use(
  cors({
    origin: process.env.WEB_ORIGIN ?? "http://localhost:5500",
  }),
);
```

Put CORS **before** your routes. Restart the API and retry fetch.

## What CORS headers do

The API responds with headers like:

```text
Access-Control-Allow-Origin: http://localhost:5500
```

That tells the browser: "JavaScript on :5500 may read this response."

## Production note

In production, set `WEB_ORIGIN` to your real frontend URL (e.g. `https://my-app.pages.dev`). Never use `*` with credentials — for Track 1, a single allowed origin is fine.

## Still stuck?

| Symptom | Fix |
| --- | --- |
| CORS error, Postman works | Add/fix `cors()` middleware |
| Preflight OPTIONS fails | Ensure CORS middleware runs before routes |
| Wrong origin | Match exact URL including port and protocol |

After CORS is fixed, Network tab should show status `200`/`201` with a readable JSON response.
