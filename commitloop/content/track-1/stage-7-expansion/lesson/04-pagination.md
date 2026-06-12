## When `SELECT *` breaks down

At 10 rows, returning everything is fine. At 10,000, you:

- Slow the API
- Bloat the JSON payload
- Freeze the browser rendering a giant list

**Pagination** returns one page at a time.

## Offset pagination

Query params: `?page=2&limit=20`

```sql
SELECT * FROM workouts
WHERE user_id = ?
ORDER BY created_at DESC
LIMIT 20 OFFSET 20;
```

(`OFFSET 20` skips the first page of 20.)

Response includes metadata:

```json
{
  "items": [ ... ],
  "page": 2,
  "limit": 20,
  "total": 153
}
```

## Search (optional)

Add `?q=run` and extend SQL:

```sql
WHERE user_id = ? AND name LIKE '%' || ? || '%'
```

Use parameterized queries — never string-concat user input into SQL.

## Frontend

- Show "Page 1 of 8" or Next/Prev buttons
- Don't fetch all pages upfront
- Keep loading state while fetching a new page

## Cursor pagination (awareness)

Large-scale apps use cursors (`?after=eyJpZCI6MTIzfQ`) instead of offset — offsets get slow on huge tables. Offset is fine for Track 1.
