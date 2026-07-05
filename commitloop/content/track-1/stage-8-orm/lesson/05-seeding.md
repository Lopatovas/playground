## Empty DB is useless for development

After `npm run db:migrate` you have tables but no rows. Clicking through the UI to create test data every time is tedious.

**Seed scripts** insert reproducible dev (and test) data — one command, same rows every time.

## Seeds vs migrations

| | **Migration** | **Seed** |
| --- | --- | --- |
| Purpose | Structure (tables, columns, indexes) | Data (rows) |
| Run when | Schema changes | Dev setup, after wipe |
| Safe on prod? | Yes (carefully) | Usually **no** — dev only |
| In Git? | Always | Yes |

Never put production user data in seeds. Use fake names and obvious test emails.

## What to seed

For your workout app:

- 2–3 categories
- 5–10 workouts across categories
- A few tags + junction rows
- Enough rows that **pagination** returns multiple pages (set `limit=3`, seed 10 workouts)

## Drizzle seed example

```javascript
// db/seed.js
import { db } from "./index.js";
import { categories, workouts, tags, workoutTags } from "./schema.js";

async function main() {
  console.log("Seeding...");

  await db.delete(workoutTags);
  await db.delete(workouts);
  await db.delete(tags);
  await db.delete(categories);

  const cats = await db
    .insert(categories)
    .values([{ name: "Cardio" }, { name: "Strength" }])
    .returning();

  await db.insert(workouts).values([
    { name: "Morning run", durationMin: 30, categoryId: cats[0].id },
    { name: "Trail run", durationMin: 45, categoryId: cats[0].id },
    { name: "Bench press", durationMin: 40, categoryId: cats[1].id },
    // ... more for pagination testing
  ]);

  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

## Prisma seed

In `package.json`:

```json
"prisma": {
  "seed": "node prisma/seed.js"
}
```

Run: `npx prisma db seed`

## npm script

```json
"db:seed": "node db/seed.js"
```

Document in README:

```bash
npm run db:migrate && npm run db:seed && npm run dev
```

## Idempotency

Ideal seed: run twice without duplicating rows. Common pattern:

1. Delete all rows (dev only!)
2. Insert fresh set

Or use `upsert` on unique keys (`tags.name`).

## Verify

1. Run seed
2. DB GUI — row counts look right
3. `GET /workouts?page=1&limit=3` — pagination works
4. `GET /workouts?q=run` — search hits seeded names

Seeds make demos, screenshots, and teammate onboarding instant.
