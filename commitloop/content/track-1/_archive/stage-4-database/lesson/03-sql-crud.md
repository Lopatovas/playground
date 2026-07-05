## CRUD maps to SQL and HTTP

| Operation | SQL | HTTP |
| --- | --- | --- |
| Create | `INSERT` | POST |
| Read | `SELECT` | GET |
| Update | `UPDATE` | PATCH |
| Delete | `DELETE` | DELETE |

```sql
INSERT INTO workouts (name, duration_min) VALUES ('Morning run', 30);
SELECT * FROM workouts;
SELECT * FROM workouts WHERE id = 2;
UPDATE workouts SET duration_min = 35 WHERE id = 1;
DELETE FROM workouts WHERE id = 2;
```

Your Stage 3 routes already spoke HTTP. Now the handlers run SQL instead of mutating an array.

## Parameterized queries

**Never** build SQL with string concatenation from user input:

```javascript
// WRONG — SQL injection risk
db.run(`INSERT INTO workouts (name) VALUES ('${name}')`);

// RIGHT
db.prepare("INSERT INTO workouts (name, duration_min) VALUES (?, ?)").run(
  name,
  duration_min,
);
```

`?` placeholders let the driver escape values safely.

## Return the created row

After INSERT, fetch the row by id and return it as JSON — same shape your frontend already expects from Stage 3.
