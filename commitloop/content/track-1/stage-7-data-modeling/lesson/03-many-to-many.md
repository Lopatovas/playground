## When one-to-many is not enough

A workout can have **many tags**. A tag can label **many workouts**. That's **many-to-many (M:N)**.

You cannot put `tag_id` on workouts — which tag? You cannot put `workout_id` on tags — which workout? You need a **junction table** (also called a join table or link table).

## Three tables

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

Each row in `workout_tags` is one link: "workout 5 has tag 2."

The composite primary key `(workout_id, tag_id)` prevents duplicate links.

## Assign a tag to a workout

```sql
INSERT INTO workout_tags (workout_id, tag_id) VALUES (?, ?);
```

API: `POST /workouts/5/tags` with body `{ "tag_id": 2 }`.

## List tags for a workout

```sql
SELECT t.id, t.name
FROM tags t
JOIN workout_tags wt ON wt.tag_id = t.id
WHERE wt.workout_id = ?;
```

## List workouts for a tag

```sql
SELECT w.*
FROM workouts w
JOIN workout_tags wt ON wt.workout_id = w.id
WHERE wt.tag_id = ?;
```

Same junction table — query direction depends on what you're listing.

## Remove a link (not the entities)

```sql
DELETE FROM workout_tags WHERE workout_id = ? AND tag_id = ?;
```

Deleting a tag row might CASCADE-remove links, or you delete links first — pick a strategy and stay consistent.

## M:N vs "store JSON in a column"

Tempting shortcut:

```sql
-- Avoid for relational modeling
ALTER TABLE workouts ADD COLUMN tags TEXT; -- '["cardio","outdoor"]'
```

JSON columns skip foreign keys, make search painful, and duplicate tag names. Junction tables are the standard relational pattern — learn them here.

## API response example

```json
{
  "id": 5,
  "name": "Morning run",
  "tags": [
    { "id": 1, "name": "cardio" },
    { "id": 3, "name": "outdoor" }
  ]
}
```

Build the `tags` array with a JOIN query in the handler.
