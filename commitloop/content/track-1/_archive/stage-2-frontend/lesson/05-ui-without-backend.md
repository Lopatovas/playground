## Outside-in: screen first

Professional teams often prototype the UI before the backend is ready. Designers and product need something to click. You get the same benefit as a solo developer: **clarity**.

```text
Stage 2   UI only        mock array in browser
Stage 3   + API          fetch replaces array; data in server RAM
Stage 4   + database     API reads/writes SQLite; data survives restart
```

Each stage adds one layer. You never throw away the previous work — you **attach** to it.

## What you prove in Stage 2

By the end of this stage you know:

- Your entity has the right fields (name, duration, etc.)
- The list and form flow makes sense
- Empty states and basic validation feel right

If the screen is wrong, fix it now — before HTTP and SQL complicate debugging.

## What you deliberately skip

- `fetch`, CORS, status codes
- Express, routes, `req.body`
- SQL, migrations, connection strings

Skipping isn't laziness. It's **sequencing**. One new concept per stage.

## Preview: the swap in Stage 3

You'll keep your HTML and render functions. You'll change `getWorkouts()` and `addWorkout()` to call your API. The user experience stays the same; the data source moves to the server.

That's the payoff of building UI-first with clean separation.
