## The persistence proof

1. Create a record through the UI
2. `kill` the API process and start it again
3. GET still returns the record

If step 3 fails, you're still on in-memory storage somewhere.
