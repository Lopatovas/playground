## Why in-memory wasn't enough

You felt it in Stage 4: restart the API, data vanishes. Production apps cannot lose user data every deploy.

A **database** stores data on **disk** (or a remote server) independent of your Node process. Stop and start the API — rows remain.

## Files vs databases

You *could* write JSON to a file. It breaks down fast: concurrent writes corrupt files, searching is slow, there's no schema enforcement.

Relational databases give you:

- **Structure** — tables with typed columns
- **Queries** — find, filter, join efficiently
- **Constraints** — `NOT NULL`, unique keys, foreign keys
- **Durability** — survives process restarts

## SQLite for learning

**SQLite** is a full SQL database in a single file. Zero setup, real SQL. Path comes from your Stage 4 `DATABASE_URL` env var.

## What changes in your code

The **routes stay the same**. `GET /workouts` and `POST /workouts` keep the same URLs and JSON shapes. Only the implementation inside the handlers changes: array operations become SQL queries.

The frontend doesn't need to know you swapped storage — you'll wire it in Stage 6.
