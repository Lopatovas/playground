## Bad input happens

A client sends:

```json
{ "name": "", "duration_min": -10 }
```

Your server should **reject** this before it hits the database.

Think about:

- Which HTTP status tells the client *they* made a mistake?
- Which status would wrongly blame the server?
- Which status would silently store garbage?

Pick the response a professional API would return.
