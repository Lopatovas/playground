## Why timestamps matter

Every record should answer: **when was this created?** Often also: **when was it last updated?**

```sql
created_at TEXT DEFAULT CURRENT_TIMESTAMP,
updated_at TEXT DEFAULT CURRENT_TIMESTAMP
```

SQLite sets `created_at` automatically on INSERT when you omit it. For UPDATE operations later, you'll set `updated_at` explicitly.

## What they're for

| Column | Purpose |
| --- | --- |
| `created_at` | Sort "newest first", audit trail, debugging |
| `updated_at` | Know if a record changed since you last saw it |

Without timestamps, two workouts named "Run" are indistinguishable except by id. With timestamps, you can show "Added 2 hours ago."

## Defaults vs application code

Prefer database defaults for `created_at`:

```sql
created_at TEXT DEFAULT CURRENT_TIMESTAMP
```

Your INSERT stays simple:

```sql
INSERT INTO workouts (name, duration_min) VALUES (?, ?);
-- created_at fills automatically
```

## Verify in the GUI

After INSERT via curl, open DB Browser → **Browse Data** → check the `created_at` column populated. If it's NULL, your DEFAULT isn't applied or you're overwriting it with NULL in INSERT.

Timestamps appear on almost every table in real apps — get the habit early.
