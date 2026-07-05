## One entity is not enough

Your app started with one table (`workouts`, `recipes`, etc.). Real domains have **relationships**:

- User **has many** workouts
- Workout **belongs to** one user
- Workout **has many** tags (many-to-many — stretch goal)

## One-to-many

Add `user_id` on the child table:

```sql
ALTER TABLE workouts ADD COLUMN user_id INTEGER REFERENCES users(id);
```

Queries scope to the current user:

```sql
SELECT * FROM workouts WHERE user_id = ?;
```

Never return another user's rows — that's an authorization bug.

## Related entity example

Add a second table linked to the first:

```sql
CREATE TABLE categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL
);

ALTER TABLE workouts ADD COLUMN category_id INTEGER REFERENCES categories(id);
```

Now list endpoints can filter: `GET /workouts?category=3`

## Migrations

Schema changes in a live project use **migrations** (Prisma migrate, SQL scripts, etc.) — not "delete the DB and start over."

Commit migrations: `feat: add categories table and foreign key`.

## API shape

Responses can embed related data:

```json
{
  "id": 1,
  "name": "Morning run",
  "category": { "id": 2, "name": "Cardio" }
}
```

Or return IDs and let the client fetch — keep it simple for Track 1.
