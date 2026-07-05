Replace **raw SQL strings** in your handlers with an **ORM** (Drizzle or Prisma). Version schema changes in **migration files** and add a **seed script** for reproducible dev data.

Pick **one** ORM and stick with it for the rest of Track 1.

## 1. Install ORM + driver

**Drizzle** (lightweight, SQL-flavored):

```bash
cd api
npm install drizzle-orm better-sqlite3
npm install -D drizzle-kit
```

**Prisma** (schema-first, popular):

```bash
cd api
npm install @prisma/client
npm install -D prisma
npx prisma init --datasource-provider sqlite
```

Commit: `chore: add ORM dependencies`.

## 2. Define schema (migration 1 — initial)

Model your Stage 7 tables in the ORM. Example with **Drizzle**:

```javascript
// db/schema.js
import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";

export const workouts = sqliteTable("workouts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  durationMin: integer("duration_min").notNull(),
  categoryId: integer("category_id"),
  createdAt: text("created_at").default("CURRENT_TIMESTAMP"),
});
```

Generate and run the **first migration** — all base tables (workouts, categories, tags, workout_tags).

Drizzle: `npx drizzle-kit generate` then `npx drizzle-kit migrate`  
Prisma: edit `schema.prisma`, then `npx prisma migrate dev --name init`

Open **DB Browser** or TablePlus — confirm tables match.

Commit: `feat: initial ORM schema migration`.

## 3. Second migration (alter)

Add one schema change you didn't have in migration 1 — e.g. a new column or index:

```sql
-- Example: 0002_add_notes_column.sql
ALTER TABLE workouts ADD COLUMN notes TEXT;
```

Or via ORM schema edit + new migrate command.

Refresh DB GUI — `notes` column visible.

Commit: `feat: add notes column migration`.

## 4. Swap handlers to ORM queries

Keep the same routes. Replace `db.prepare("SELECT ...")` with ORM calls.

**Drizzle example:**

```javascript
import { db } from "./db/index.js";
import { workouts } from "./db/schema.js";
import { desc, like, sql } from "drizzle-orm";

app.get("/workouts", async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, parseInt(req.query.limit, 10) || 20);
  const q = (req.query.q ?? "").trim();

  let query = db.select().from(workouts).orderBy(desc(workouts.createdAt));
  if (q) query = query.where(like(workouts.name, `%${q}%`));

  const items = await query.limit(limit).offset((page - 1) * limit);
  const [{ count }] = await db.select({ count: sql`count(*)` }).from(workouts);

  res.json({ items, page, limit, total: count });
});
```

**Prisma** uses similar patterns with `prisma.workout.findMany({ where, skip, take })`.

Test with Postman — same JSON shape as Stage 7.

Commit: `refactor: use ORM in workout routes`.

## 5. Seed script

Create `api/db/seed.js` (or `prisma/seed.ts`):

```javascript
import { db } from "./index.js";
import { categories, workouts, tags, workoutTags } from "./schema.js";

async function seed() {
  // Clear dev data (optional — document if destructive)
  await db.delete(workoutTags);
  await db.delete(workouts);
  await db.delete(tags);
  await db.delete(categories);

  const [cardio] = await db.insert(categories).values({ name: "Cardio" }).returning();
  const [strength] = await db.insert(categories).values({ name: "Strength" }).returning();

  await db.insert(workouts).values([
    { name: "Morning run", durationMin: 30, categoryId: cardio.id },
    { name: "Bench press", durationMin: 45, categoryId: strength.id },
  ]);

  const [tag] = await db.insert(tags).values({ name: "outdoor" }).returning();
  // ... link via workout_tags
}

seed().then(() => console.log("Seed complete"));
```

Add npm script:

```json
"scripts": {
  "db:migrate": "drizzle-kit migrate",
  "db:seed": "node db/seed.js"
}
```

Fresh clone workflow:

```bash
npm run db:migrate
npm run db:seed
npm run dev
```

Commit: `feat: add database seed script`.

## Outcome

- ORM replaces ad-hoc SQL in handlers
- ≥2 migrations in Git (initial + alter)
- Seed script for dev data
- Schema verified in DB GUI
- Same API URLs — frontend unchanged

Stage 9 adds auth on top of this schema.
