## Tables, rows, columns

A **table** holds one kind of thing. Each **row** is one record; each **column** is a field.

| id | name | duration_min | created_at |
| --- | --- | --- | --- |
| 1 | Morning run | 30 | 2026-06-01 |
| 2 | Yoga | 45 | 2026-06-02 |

## Primary key

The `id` column is the **primary key** — unique per row, usually auto-incrementing:

```sql
id INTEGER PRIMARY KEY AUTOINCREMENT
```

It's how you reference one specific record (`GET /workouts/2` → `WHERE id = 2`).

## Defining the table

```sql
CREATE TABLE workouts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  duration_min INTEGER NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

`NOT NULL` means the column is required. The database rejects bad rows before they're stored — your API should validate too, but the DB is the last line of defense.
