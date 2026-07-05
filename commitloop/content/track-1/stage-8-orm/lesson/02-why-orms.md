## Raw SQL worked — why add an ORM?

Stage 5–7 used `better-sqlite3` with hand-written SQL strings. That teaches the database. ORMs add a layer on top for **everyday application code**:

| Raw SQL | ORM |
| --- | --- |
| String in handler | Typed objects / query builder |
| Manual column names | Schema defined once |
| You track migration SQL | Tool generates/applies migrations |
| Easy typo in `SELECT` | Editor autocomplete on fields |

## What an ORM is

An **Object-Relational Mapper** translates between:

- **Tables & rows** in SQLite
- **Objects & methods** in JavaScript

```javascript
// Raw SQL
db.prepare("SELECT * FROM workouts WHERE id = ?").get(id);

// Drizzle-ish
await db.select().from(workouts).where(eq(workouts.id, id));
```

Both hit the same SQLite file. The ORM builds the SQL for you.

## Pick one for Track 1

Both work with Express + SQLite:

| | **Drizzle** | **Prisma** |
| --- | --- | --- |
| Style | SQL-like query builder | Schema file + client API |
| Migrations | drizzle-kit | prisma migrate |
| Learning curve | Closer to raw SQL | More abstraction |

Choose one. Don't switch mid-track.

## ORMs don't replace SQL knowledge

You still need to understand:

- Tables, FKs, JOINs, indexes (Stage 7)
- What query the ORM generates (logs / EXPLAIN when debugging)
- When to drop to raw SQL for an edge case

ORMs reduce boilerplate and centralize schema — they don't make the database disappear.

## Same stack, transferable elsewhere

Drizzle and Prisma are JavaScript-specific. The **ideas** transfer to Entity Framework (.NET), Hibernate (Java), SQLAlchemy (Python): define schema, migrate, query in code.

## When raw SQL stays fine

Reports, one-off admin scripts, or complex analytics might stay as SQL files. Your main CRUD routes are where the ORM earns its keep.
