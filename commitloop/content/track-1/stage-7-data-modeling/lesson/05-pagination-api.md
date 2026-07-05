## When `SELECT *` breaks down

At 10 rows, returning everything is fine. At 10,000, you:

- Slow the API
- Bloat the JSON payload
- Freeze the browser rendering a giant list

**Pagination** returns one page at a time.

## Query params

`GET /workouts?page=2&limit=20`

Parse in Express:

```javascript
const page = Math.max(1, parseInt(req.query.page, 10) || 1);
const limit = Math.min(100, parseInt(req.query.limit, 10) || 20);
const offset = (page - 1) * limit;
```

Cap `limit` — clients shouldn't request 100,000 rows.

## SQL — offset pagination

```sql
SELECT * FROM workouts
ORDER BY created_at DESC
LIMIT ? OFFSET ?;
```

(`OFFSET 20` skips the first page of 20.)

Count total rows for metadata:

```sql
SELECT COUNT(*) AS total FROM workouts;
```

## Response shape

```json
{
  "items": [ ... ],
  "page": 2,
  "limit": 20,
  "total": 153
}
```

Frontend can show "Page 2 of 8" with `Math.ceil(total / limit)`.

## Combine with filters

Pagination applies **after** filters:

```sql
SELECT * FROM workouts
WHERE category_id = ?
ORDER BY created_at DESC
LIMIT ? OFFSET ?;
```

Same `page`/`limit` params — the filtered set is what gets sliced.

## Test with curl

```bash
curl "http://localhost:3001/workouts?page=1&limit=5"
curl "http://localhost:3001/workouts?page=2&limit=5"
```

Page 2's first item should differ from page 1's when total > 5.

## Cursor pagination (awareness)

Large-scale apps use cursors (`?after=eyJpZCI6MTIzfQ`) instead of offset — offsets get slow on huge tables. Offset is fine for Track 1.

## Frontend (Stage 10 preview)

- Next/Prev buttons call fetch with `page + 1`
- Don't fetch all pages upfront
- Reuse loading state from Stage 6 while fetching a new page
