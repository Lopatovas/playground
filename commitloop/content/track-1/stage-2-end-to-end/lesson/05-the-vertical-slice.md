## Build down, not across

A tempting mistake is to build each layer fully before moving on: perfect the database, then perfect the API, then start the UI. You end up with lots of code and **nothing that works end to end** for a long time.

A **vertical slice** does the opposite. You build *one feature* through *every layer*, thin but complete:

```text
        ┌─────────────────────────────┐
  UI    │  list workouts + add form    │
        ├─────────────────────────────┤
  API   │  GET /workouts, POST /workouts│
        ├─────────────────────────────┤
  DB    │  workouts table              │
        └─────────────────────────────┘
        one feature, all the way down
```

When the slice works, you have a **running product** — small, but real. Every later feature is another slice through the same layers.

## The end-to-end flow

Trace a single "add a workout" click through your whole system:

1. User types a name and submits the form.
2. Frontend `fetch`es `POST /workouts` with a JSON body.
3. Express parses the body, runs `INSERT`, gets back the new row.
4. Express responds `201 Created` with the new workout as JSON.
5. Frontend reads the response and updates the list on screen.

If any link breaks, the feature breaks. Building the slice forces every link to exist.

## Debugging across the boundary

When something doesn't work, isolate the layer:

| Symptom | Likely culprit | How to check |
| --- | --- | --- |
| CORS error in console | API missing CORS config | Browser devtools → Network tab |
| `req.body` is undefined | Missing `express.json()` or `Content-Type` | Log `req.body` on the server |
| Empty list but no error | API returns `[]`; data not inserted | Query the DB directly |
| 404 / 500 | Wrong path or server exception | Read the server logs and status code |

Open your browser's **Network tab** and your server **logs** side by side. The request that fails tells you which layer to look at.

## Your slice for this stage

Pick **one entity** from your project (workouts, recipes, transactions…) and ship a slice: a table, `GET` + `POST` endpoints, and a frontend that lists and creates. That's a working full-stack app. Everything from here is expansion.
