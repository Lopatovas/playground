## The expansion mindset

Stages 0–5 built the stack — UI, API, database. Stage 6 wired the browser to the API. Stage 7 is where your **data model grows up**:

- One table is not enough — add related entities
- Lists outgrow one screen — pagination and search
- Queries get slower — indexes help

**Same repository. Same Git history. New tables and columns.**

This is what professional engineering looks like — evolution, not tutorial reset.

## What you'll add

| Feature | Why it matters |
| --- | --- |
| **One-to-many** | Categories, comments, parent/child records |
| **Many-to-many** | Tags, permissions, enrollments — junction tables |
| **Indexes** | Faster filters and sorts as rows accumulate |
| **Pagination** | Bounded API responses |
| **Search** | Filter by name or keyword via query params |

You won't model every domain on earth. You'll grow **your** app with one 1:N relationship, one M:N link, and list endpoints that scale.

## Don't wipe the database

When you need a new table, **add** it:

```sql
CREATE TABLE categories ( ... );
ALTER TABLE workouts ADD COLUMN category_id INTEGER REFERENCES categories(id);
```

Deleting `app.db` and starting over throws away your test data and hides the skill you'll need in every job: **schema changes on a live project**.

Stage 8 introduces formal **migration files** so these changes are versioned and repeatable. For now, run SQL scripts (or `.sql` files in a `migrations/` folder) and commit them.

## Ship incrementally

One feature per branch:

```bash
git switch -c feature/categories
# ... merge PR ...
git switch -c feature/tags
```

Small PRs are easier to review and revert. Your Git graph should show growth, not one giant commit.

## What's next (not this stage)

Authentication and user-scoped data come in **Stage 9**. For now, all records are shared — focus on relationships and query patterns.
