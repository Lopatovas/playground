## Why a database, not a file

You could store data in a JSON file, but you'd quickly hit walls: concurrent writes corrupt it, searching is slow, and there's no structure. A **database** is built for storing, querying, and protecting data as it grows.

In Track 1 we use a **relational (SQL) database**. For local development, **SQLite** is perfect — it's a single file, zero setup. Later (Stage 4) you'll swap it for **PostgreSQL** in production. The SQL you learn works on both.

## Tables, rows, columns

A relational database organizes data into **tables**, like a spreadsheet:

- A **table** holds one kind of thing (e.g. `workouts`).
- Each **row** is one record (one workout).
- Each **column** is a field with a type (`name` is text, `duration` is a number).

| id | name | duration_min | created_at |
| --- | --- | --- | --- |
| 1 | Morning run | 30 | 2026-06-01 |
| 2 | Yoga | 45 | 2026-06-02 |

The `id` column is the **primary key** — a unique identifier for each row, usually auto-incrementing. It's how you reference one specific record (e.g. `GET /workouts/2`).

## Defining a table with SQL

**SQL** (Structured Query Language) is how you talk to a relational database. You define a table once:

```sql
CREATE TABLE workouts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  duration_min INTEGER NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

`NOT NULL` means the column is required. The database **enforces** these rules — bad data is rejected before it's stored.

## The four operations (CRUD)

Almost everything is one of four operations:

| Operation | SQL | HTTP |
| --- | --- | --- |
| **C**reate | `INSERT` | POST |
| **R**ead | `SELECT` | GET |
| **U**pdate | `UPDATE` | PUT/PATCH |
| **D**elete | `DELETE` | DELETE |

```sql
INSERT INTO workouts (name, duration_min) VALUES ('Morning run', 30);
SELECT * FROM workouts;
SELECT * FROM workouts WHERE id = 2;
UPDATE workouts SET duration_min = 35 WHERE id = 1;
DELETE FROM workouts WHERE id = 2;
```

Notice the symmetry: your REST endpoints map almost one-to-one onto these SQL operations. That mapping is the heart of a CRUD app.

> You don't have to write raw SQL forever — query builders and ORMs (like Prisma) generate it for you. But understanding the SQL underneath makes you far more effective.
