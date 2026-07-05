## See the schema, not just rows

In Stage 5 you opened DB Browser or TablePlus to **browse data** — run SELECT, confirm rows after POST.

Stage 8 adds the **schema view**: tables, columns, types, keys, indexes — the blueprint of your database.

## Open schema view

| Tool | Where to look |
| --- | --- |
| **DB Browser for SQLite** | *Database Structure* tab |
| **TablePlus** | Left sidebar → table → *Structure* |
| **DBeaver** | ER diagram or column list per table |

You should see:

- Table names (`workouts`, `categories`, `tags`, `workout_tags`)
- Column types (`INTEGER`, `TEXT`, `NOT NULL`)
- Primary keys and foreign keys (arrows or FK constraints)

## After every migration

**Never** assume a migration worked because the CLI said "success."

1. Run the migration command
2. **Refresh** the GUI connection (re-open file if needed)
3. Confirm new tables/columns/indexes appear
4. Hit the API with Postman — one GET that uses the new column

This habit catches typos (`catgeory_id`), missed alters, and wrong database files (pointing at `dev.db` vs `app.db`).

## Compare GUI to migration file

Migration says:

```sql
ALTER TABLE workouts ADD COLUMN notes TEXT;
```

Schema view must show `notes` on `workouts`. If not, you migrated the wrong DB or the file failed silently.

## ER diagrams (optional)

Some GUIs draw relationship lines from FK definitions. Useful for M:N — `workout_tags` should connect `workouts` and `tags`.

## Same tool, deeper use

You already know the GUI from Stage 5. Stage 8 uses it to **validate structure**, not just row counts — especially before teammates or CI run the same migrations.
