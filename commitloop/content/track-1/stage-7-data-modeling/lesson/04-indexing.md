## Tables scan rows — indexes skip ahead

Without an index, SQLite reads **every row** to find matches:

```sql
SELECT * FROM workouts WHERE name LIKE '%run%';
```

At 100 rows, fine. At 100,000, slow.

An **index** is a sorted lookup structure — like a book index pointing to page numbers. The database uses it to find matching rows faster.

## Create an index

```sql
CREATE INDEX idx_workouts_created_at ON workouts(created_at);
CREATE INDEX idx_workouts_name ON workouts(name);
```

After creating one, run in sqlite3:

```sql
EXPLAIN QUERY PLAN SELECT * FROM workouts ORDER BY created_at DESC LIMIT 20;
```

Look for `USING INDEX` vs `SCAN TABLE` — the planner chooses based on your query.

## When to index

Good candidates:

- Columns in **WHERE** clauses you run often (`category_id`, `name`)
- Columns in **ORDER BY** (`created_at`)
- **Foreign keys** used in JOINs (some databases auto-index FKs; SQLite does not)

Skip indexing every column — indexes speed reads but slow writes slightly and use disk space.

## Indexes and LIKE search

`LIKE '%run%'` (leading wildcard) often **cannot** use a B-tree index efficiently. Indexes still help for:

- `LIKE 'run%'` (prefix search)
- Exact matches (`WHERE category_id = ?`)
- Sorting large result sets

Track 1 search uses simple `LIKE` — an index on `name` may help prefix queries; full `%q%` search is acceptable at small scale.

## Unique indexes

```sql
CREATE UNIQUE INDEX idx_tags_name ON tags(name);
```

Enforces uniqueness at the database level — backup for `UNIQUE` on the column.

## Verify in DB GUI

Open your GUI's schema view. Indexes appear under each table. After adding one, confirm it shows up and re-test your paginated list endpoint.

## Don't over-engineer

One or two well-chosen indexes beat indexing everything. Add an index when you have a real filter or sort on a growing table — which you do now with pagination and search.
