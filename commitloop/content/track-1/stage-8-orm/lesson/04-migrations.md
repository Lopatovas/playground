## Schema changes are code, not clicks

In Stage 7 you ran SQL scripts to add tables. That works once. Teams need **migration files** — versioned, ordered, replayable schema changes in Git.

**Rule:** Never "just edit the DB by hand" on a shared project. Change the migration → run migrate → verify in GUI.

## What a migration file contains

DDL (Data Definition Language) — structure, not sample rows:

```sql
-- migrations/0001_create_workouts.sql
CREATE TABLE workouts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  duration_min INTEGER NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

```sql
-- migrations/0002_add_category_id.sql
ALTER TABLE workouts ADD COLUMN category_id INTEGER REFERENCES categories(id);
```

Each file is one step forward. Filename order matters: `0001`, `0002`, …

## Drizzle workflow

1. Edit `db/schema.js`
2. `npx drizzle-kit generate` — creates SQL in `migrations/`
3. `npx drizzle-kit migrate` — applies pending files to SQLite
4. Refresh DB GUI

Commit **both** the schema file and generated SQL.

## Prisma workflow

1. Edit `prisma/schema.prisma`
2. `npx prisma migrate dev --name add_category_id` — creates folder + SQL
3. Prisma Client regenerates automatically
4. Refresh DB GUI

## Track 1 requirement: at least 2 migrations

1. **Initial** — all base tables from Stage 7 model
2. **Alter** — add column, index, or table (e.g. `notes`, new index)

Proves you can evolve schema without wiping data.

## Fresh machine / new teammate

```bash
git clone ...
npm install
npm run db:migrate   # applies 0001, 0002, ... in order
npm run db:seed      # optional sample data
```

Same schema everywhere — local, CI, staging.

## Rollback awareness

Track 1 focuses on **forward** migrations. Production rollbacks need down migrations or backups — mention in README, don't build full down support unless curious.

## Don't edit old migrations

Once merged and applied on shared DBs, **never change** `0001_create_workouts.sql`. Add `0003_fix_typo.sql` instead. Editing history breaks teammates.

## Checklist before merge

- [ ] Migration runs clean on empty DB
- [ ] Migration runs on existing DB (from Stage 7)
- [ ] GUI shows expected schema
- [ ] API tests pass
