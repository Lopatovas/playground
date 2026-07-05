## Handler refactor

Your `GET /workouts` handler used `db.prepare("SELECT * FROM workouts")`. You replace it with Drizzle's `db.select().from(workouts)`.

Does the frontend need to change?
