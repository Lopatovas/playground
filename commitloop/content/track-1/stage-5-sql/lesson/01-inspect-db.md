## Inspect before you trust

After every API write, **look at the database directly**. Don't assume INSERT worked because curl returned 201.

Two tools — learn both:

| Tool | How to open | Best for |
| --- | --- | --- |
| **CLI** (`sqlite3`) | Terminal: `sqlite3 data/app.db` | Quick queries, scripts, CI |
| **GUI** (DB Browser for SQLite, TablePlus) | Open the `.db` file | Browsing rows, visual schema |

Same habit on Postgres later (`psql` + pgAdmin/TablePlus).

## CLI basics

```bash
sqlite3 data/app.db
```

Inside the prompt:

```sql
.tables
.schema workouts
SELECT * FROM workouts;
.quit
```

Run `SELECT * FROM workouts;` after every POST in this stage. If the row isn't there, the bug is in your SQL — not curl.

## GUI basics

1. Open DB Browser for SQLite (or TablePlus)
2. **Open Database** → select `data/app.db`
3. **Browse Data** tab → pick `workouts` table
4. Refresh after API writes — see rows appear

The GUI shows column names and types — useful when debugging schema mistakes.

## The verification habit

```text
curl POST /workouts → SELECT * FROM workouts → row exists?
```

API logs + curl + direct SQL = three views of the same truth. If SQL shows the row but GET returns empty, the bug is in your SELECT handler.

Start this habit now. It saves hours in every later stage.
