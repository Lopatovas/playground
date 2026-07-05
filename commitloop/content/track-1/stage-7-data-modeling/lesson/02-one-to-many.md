## One entity is not enough

Your app started with one table (`workouts`, `recipes`, etc.). Real domains have **relationships**:

- Category **has many** workouts
- Workout **belongs to** one category

## One-to-many

The "many" side holds the foreign key:

```sql
CREATE TABLE categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE workouts ADD COLUMN category_id INTEGER REFERENCES categories(id);
```

`category_id` on `workouts` points to `categories.id`. SQLite enforces the link when you use `REFERENCES`.

## Query with a join

List workouts with category name:

```sql
SELECT w.*, c.name AS category_name
FROM workouts w
LEFT JOIN categories c ON w.category_id = c.id
ORDER BY w.created_at DESC;
```

`LEFT JOIN` keeps workouts even if `category_id` is NULL (uncategorized).

## Filter by related entity

API: `GET /workouts?category_id=2`

```sql
SELECT * FROM workouts WHERE category_id = ?;
```

Always use `?` placeholders — same rule as Stage 5.

## API shape options

Embed related data in the response:

```json
{
  "id": 1,
  "name": "Morning run",
  "category": { "id": 2, "name": "Cardio" }
}
```

Or return `category_id` only and let the client fetch categories separately. For Track 1, embedding one level is fine.

## Orphan rows

If you delete a category, what happens to workouts pointing at it?

- **RESTRICT** — database rejects the delete (safest default to learn)
- **SET NULL** — `category_id` becomes NULL
- **CASCADE** — delete workouts too (dangerous unless intentional)

Pick one and document it. For Track 1, avoid deleting categories that are in use, or use `SET NULL`.

## Verify in the DB GUI

After ALTER, open DB Browser or TablePlus and confirm:

- `categories` table exists
- `workouts.category_id` column appears
- Sample rows link correctly
