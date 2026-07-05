## Configuration belongs in the environment

Hard-coding ports and secrets in source code breaks when you deploy. Use **environment variables**:

```javascript
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => console.log(`API on :${PORT}`));
```

`process.env` reads values from the environment. Locally you set them in a `.env` file (with `dotenv`) or in your shell.

## .env and .env.example

Create `.env` for local secrets — **never commit it**:

```bash
PORT=3001
DATABASE_URL=./data/app.db
```

Commit `.env.example` with placeholder values so teammates know what's needed:

```bash
PORT=3001
DATABASE_URL=./data/app.db
```

Add `.env` to `.gitignore`.

## DATABASE_URL placeholder

You don't have a database yet — Stage 5 adds SQLite. Still define `DATABASE_URL` now so the config pattern is in place before you need it:

```javascript
const dbPath = process.env.DATABASE_URL || "./data/app.db";
// used in Stage 5
```

## Verify config loads

```bash
PORT=4000 node server.js
curl http://localhost:4000/workouts
```

If the server listens on 4000, env vars work. Production hosts set `PORT` automatically — your code shouldn't assume 3001 forever.

## What goes in env vars

| Variable | Example | Why |
| --- | --- | --- |
| `PORT` | `3001` | Host may assign a random port |
| `DATABASE_URL` | `./data/app.db` | Different DB per environment |
| `JWT_SECRET` | (later) | Never in source code |

Stage 5 reads `DATABASE_URL` when opening SQLite. Stage 6 doesn't change env setup — only adds frontend fetch.
