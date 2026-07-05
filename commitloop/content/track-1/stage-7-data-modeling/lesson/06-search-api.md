## Search is a filtered list

Users type "run" and expect matching workouts — not the full table. Add a query param:

`GET /workouts?q=run&page=1&limit=20`

Search and pagination work together: filter first, then slice.

## Parse the param

```javascript
const q = (req.query.q ?? "").trim();
```

Empty `q` means no filter — return all rows (paginated as usual).

## SQL — parameterized LIKE

```sql
SELECT * FROM workouts
WHERE name LIKE '%' || ? || '%'
ORDER BY created_at DESC
LIMIT ? OFFSET ?;
```

SQLite concatenation with `||`. Pass `q` as the first bound value.

**Never** do this:

```javascript
// WRONG — SQL injection
db.prepare(`SELECT * FROM workouts WHERE name LIKE '%${q}%'`);
```

Same injection rules as Stage 5 — always `?` placeholders.

## Combine with category filter

```sql
SELECT * FROM workouts
WHERE category_id = ?
  AND name LIKE '%' || ? || '%'
ORDER BY created_at DESC
LIMIT ? OFFSET ?;
```

Build the WHERE clause dynamically only when params are present — still use placeholders for values.

## Count for pagination metadata

When search is active, count the filtered set:

```sql
SELECT COUNT(*) AS total FROM workouts WHERE name LIKE '%' || ? || '%';
```

`total` in the response reflects search results, not the whole table.

## Response unchanged

Same envelope as pagination-only:

```json
{
  "items": [ { "id": 3, "name": "Trail run", ... } ],
  "page": 1,
  "limit": 20,
  "total": 2
}
```

## Test cases

| Request | Expect |
| --- | --- |
| `?q=run` | Only names containing "run" |
| `?q=` or no `q` | All rows (paginated) |
| `?q=zzz` | Empty `items`, `total: 0` |
| `?q=run&page=2&limit=1` | Second matching row if exists |

Use Postman or curl — same tools from Stage 6.

## Not full-text search engines

Track 1 uses simple `LIKE` — no Elasticsearch, no Postgres `tsvector`. That's enough to learn the API pattern. Stage 10 wires a search box in the UI to this endpoint.
