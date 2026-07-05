## The persistence proof

1. curl POST a record
2. `SELECT * FROM workouts` — row exists
3. Kill the API process and start it again
4. curl GET still returns the record

If step 4 fails, you're still on in-memory storage somewhere.
