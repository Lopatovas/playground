## How the pieces connect

A full-stack web app is not one program — it's **layers** that talk to each other. Track 1 builds all of them inside one repo. Here's the landscape before you pick a domain.

```text
┌─────────────────────────────────────────────────────────────┐
│  Browser (user)                                             │
│    HTML + CSS + JavaScript  ←→  Chrome DevTools             │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP (fetch / forms)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│  Server (Node.js + Express)  ←→  Postman / curl             │
│    Routes → handlers → data access                          │
└──────────────────────────────┬──────────────────────────────┘
                               │ SQL queries
                               ▼
┌─────────────────────────────────────────────────────────────┐
│  Database (SQLite in dev)  ←→  sqlite3 CLI + DB GUI         │
│    Tables, rows, relationships                              │
└─────────────────────────────────────────────────────────────┘

        Git + GitHub wrap the whole repo (every layer)
        Hosting (later) serves API + static web to the internet
```

Read it top to bottom: the **user** interacts with the **frontend**; the frontend calls the **API**; the API reads and writes the **database**. **Git** versions every file in the project regardless of layer.

## Frontend — what the user sees

The **frontend** lives in your `web/` folder. It's HTML (structure), CSS (layout and style), and JavaScript (behavior). Track 1 uses **vanilla** JS — no React or Vue. The browser downloads these files and renders them.

Your job here: present data, capture clicks and form input, show loading and error states. DevTools **Elements** shows the live DOM; **Console** shows JS errors.

## Backend — the API

The **backend** lives in `api/`. Express listens for HTTP requests (`GET /workouts`, `POST /workouts`, etc.), runs handler code, and returns JSON. The frontend never touches the database directly — it always goes through the API.

You verify endpoints with **Postman** (or `curl`) before debugging `fetch` in the browser. Same request, fewer moving parts.

## Database — durable storage

The **database** stores records that survive server restarts. Track 1 starts with **SQLite** (a single file on disk) and raw SQL, then swaps to an ORM in a later stage. Tables have columns, types, and primary keys; related tables connect with foreign keys.

After every write, habit: open the **DB GUI** or run `SELECT` in the CLI and confirm the row exists.

## Git — history of everything

**Git** is not a runtime layer users hit — it's how *you* track every change across `web/`, `api/`, and config files. Commits are snapshots; GitHub is the remote backup CommitLoop reads.

One repo, all layers, growing for the whole track. No per-stage resets.

## Hosting — making it public

Locally, you run `node api/server.js` and open `web/index.html` (or a simple static server). **Hosting** (Stage 11) puts both behind public URLs so anyone on the internet can use your app. Environment variables separate dev secrets from production config.

You won't deploy today. Just know: **local dev** → **Git history** → **hosted URLs** is the arc.

## What you'll add when

| Stage | Layer | Capability |
| --- | --- | --- |
| 0 | Git | Repo, README, first push |
| 1 | Git | Branches, PRs, daily commits |
| 2 | Frontend | Semantic HTML, flexbox, responsive shell |
| 3 | Frontend | DOM, events, mock CRUD in JS |
| 4+ | API + DB | Express, SQL, then wire frontend |

The domain you pick next (workouts, recipes, etc.) only changes **labels and business rules** — this stack stays the same.
