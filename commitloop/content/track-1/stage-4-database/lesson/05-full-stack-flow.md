## You built outside-in

```text
Stage 2   UI           mock array in browser
Stage 3   + API        fetch → in-memory on server
Stage 4   + database   same fetch → SQLite on disk
```

Each layer attached to the one before. Nothing thrown away — **extended**.

## The vertical slice, end to end

Trace "add a workout" through all three layers:

1. User submits the form (UI)
2. `fetch POST /workouts` with JSON body (HTTP)
3. Express validates, runs `INSERT` (API)
4. SQLite stores the row (database)
5. API responds `201` with the new record (HTTP)
6. UI re-renders the list (UI)

If any link breaks, the feature breaks. You now have every link.

## Debugging across layers

| Symptom | Layer to check |
| --- | --- |
| CORS error | API CORS config |
| `req.body` empty | `express.json()`, headers |
| 201 but empty list on refresh | INSERT failed silently? Check server logs |
| Data gone after API restart | Still using in-memory? SQL not wired |
| UI works, curl returns `[]` | Different DB file path? |

Network tab + server logs + direct SQL query (`SELECT * FROM workouts`) — three views of the same truth.

## What's next

Stage 5 ships it beyond your laptop. Stage 6 locks behavior in with tests. Stage 7 grows the product — auth, related data, pagination — in the same repo.
