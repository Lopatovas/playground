Your `GET /workouts` endpoint needs to read rows from the database. That's a `SELECT`.

The shape of a read query:

```sql
SELECT <columns> FROM <table> WHERE <condition>;
```

- `SELECT *` means "all columns". You can also name them: `SELECT id, name`.
- `FROM workouts` names the table.
- `WHERE` filters rows (optional). `SELECT * FROM workouts WHERE id = 2;` returns one workout.

For the checkpoint, write the query that returns **every column of every row** from the `workouts` table.
