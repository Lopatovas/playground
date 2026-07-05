## Swap the layer, not the contract

Your frontend still calls:

- `GET /workouts?page=1&limit=20&q=run`
- `POST /workouts` with JSON body

**URLs, methods, status codes, and response JSON stay the same.** Only the handler internals change — from `db.prepare(...)` to ORM calls.

## Project structure

```
api/
  db/
    index.js      # connection + drizzle/prisma client
    schema.js     # table definitions (Drizzle) or use schema.prisma
    migrations/   # generated SQL files
    seed.js
  routes/
    workouts.js   # HTTP — calls db layer
```

Keep routes thin: parse `req`, call ORM, send `res.json()`.

## Drizzle — list with pagination and search

```javascript
import { db } from "../db/index.js";
import { workouts } from "../db/schema.js";
import { desc, like, sql, eq } from "drizzle-orm";

export async function listWorkouts({ page, limit, q, categoryId }) {
  const offset = (page - 1) * limit;
  let where = undefined;

  if (q) where = like(workouts.name, `%${q}%`);
  if (categoryId) where = eq(workouts.categoryId, categoryId);

  const items = await db
    .select()
    .from(workouts)
    .where(where)
    .orderBy(desc(workouts.createdAt))
    .limit(limit)
    .offset(offset);

  const [{ total }] = await db
    .select({ total: sql`count(*)` })
    .from(workouts)
    .where(where);

  return { items, page, limit, total };
}
```

## Drizzle — create

```javascript
export async function createWorkout({ name, durationMin, categoryId }) {
  const [row] = await db
    .insert(workouts)
    .values({ name, durationMin, categoryId })
    .returning();
  return row;
}
```

## Prisma — equivalent patterns

```javascript
const items = await prisma.workout.findMany({
  where: q ? { name: { contains: q } } : undefined,
  orderBy: { createdAt: "desc" },
  skip: (page - 1) * limit,
  take: limit,
});

const total = await prisma.workout.count({ where: ... });
```

## M:N with ORM

Junction inserts:

```javascript
await db.insert(workoutTags).values({ workoutId: 5, tagId: 2 });
```

Relations can use ORM `with`/`include` to fetch tags with a workout — read your ORM's docs for relation APIs.

## Verify nothing broke

Run your Stage 6 Postman collection. Every request should behave as before. If the shape changed, fix the handler — not the frontend.

## Refactor safely

One route at a time:

1. Replace GET list → test
2. Replace POST → test
3. Replace GET by id → test

Commit after each: `refactor: ORM for workout list`.
