## The Network tab is your HTTP debugger

When the UI calls `fetch`, the browser sends a real HTTP request. **DevTools → Network** shows every request: URL, method, status, headers, timing, and response body.

Open it **before** you click anything. Check **Preserve log** so navigation doesn't clear the list.

## Walk through one request

1. Start your API and open the frontend
2. Open DevTools → **Network**
3. Refresh the page (triggers GET /workouts)
4. Click the request row

You'll see:

| Panel | What it tells you |
| --- | --- |
| **Headers** | Request URL, method, status code |
| **Payload** | Body sent on POST (if any) |
| |
| **Response** | JSON the server returned |
| **Timing** | How long the round trip took |

## Compare with Postman

Run the same GET in Postman and in the browser. The response body should match. If Postman works but Network shows red:

- **CORS error** — browser blocked before reading the response (fix on API)
- **Wrong URL** — typo in `fetch` URL (compare with Postman)
- **Missing header** — POST without `Content-Type: application/json`

## Status codes at a glance

| Code | Meaning | Action |
| --- | --- | --- |
| 200 | OK | Parse JSON, render |
| 201 | Created | Parse JSON, refresh list |
| 400 | Bad request | Show validation message |
| 404 | Not found | Check route or id |
| 500 | Server error | Check API logs |

Click a failed request → **Response** tab often shows `{ "error": "..." }` from your API.

## Filter noise

Type `workouts` in the filter box to hide CSS, fonts, and images. Focus on **Fetch/XHR** requests only.

## Habit

Keep Network open whenever you work on fetch code. One glance beats ten `console.log` guesses about what the server actually returned.
