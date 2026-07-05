Grow your **data model** in the same repository: related tables, a many-to-many link, indexes, pagination, and search. No auth yet — that comes in Stage 9.

## Phase 1 — One-to-many (categories)

```bash
git switch -c feature/categories
```

Add a related table and foreign key:

```sql
CREATE TABLE categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE workouts ADD COLUMN category_id INTEGER REFERENCES categories(id);
```

API:

- `GET /categories`, `POST /categories`
- `GET /workouts?category_id=2` filters by category (optional)

Verify in sqlite3 or DB Browser: FK column exists, joins return expected rows.

Commit: `feat: add categories with foreign key`.

## Phase 2 — Many-to-many (tags)

```bash
git switch main && git pull
git switch -c feature/tags
```

```sql
CREATE TABLE tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE workout_tags (
  workout_id INTEGER NOT NULL REFERENCES workouts(id),
  tag_id INTEGER NOT NULL REFERENCES tags(id),
  PRIMARY KEY (workout_id, tag_id)
);
```

API ideas (pick what fits your domain):

- `GET /tags`, `POST /tags`
- `POST /workouts/:id/tags` with `{ "tag_id": 3 }` — inserts into junction table
- `GET /workouts/:id` includes tag names via JOIN

Commit: `feat: add workout–tag many-to-many`.

## Phase 3 — Index

Add an index on a column you filter or sort by:

```sql
CREATE INDEX idx_workouts_created_at ON workouts(created_at);
-- or
CREATE INDEX idx_workouts_name ON workouts(name);
```

Re-run a slow query before/after (or use `EXPLAIN QUERY PLAN` in sqlite3). Document which index you added and why.

Commit: `feat: add index on workouts lookup column`.

## Phase 4 — Pagination

```bash
git switch -c feature/pagination
```

`GET /workouts?page=1&limit=20` returns:

```json
{
  "items": [ ... ],
  "page": 1,
  "limit": 20,
  "total": 153
}
```

SQL pattern:

```sql
SELECT * FROM workouts
ORDER BY created_at DESC
LIMIT ? OFFSET ?;
```

Count query for `total`: `SELECT COUNT(*) FROM workouts`.

Test: page 2 differs from page 1 when total > limit.

Commit: `feat: paginate workout list`.

## Phase 5 — Search

Extend the list endpoint: `GET /workouts?q=run&page=1&limit=20`

```sql
SELECT * FROM workouts
WHERE name LIKE '%' || ? || '%'
ORDER BY created_at DESC
LIMIT ? OFFSET ?;
```

Use **placeholders** for `q`, limit, and offset. Combine with pagination — search narrows the set, pagination slices it.

Test with curl:

```bash
curl "http://localhost:3001/workouts?q=run&page=1&limit=10"
```

Commit: `feat: add search query param to workout list`.

## Outcome

Same app, richer schema:

- 1:N relationship (categories)
- M:N junction table (tags)
- Index on a hot column
- Paginated, searchable list API

Stage 8 replaces raw SQL with an ORM and formal migration files — the routes stay the same.
