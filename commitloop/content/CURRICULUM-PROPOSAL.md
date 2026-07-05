# Track 1 — Curriculum Spec

**Status:** Implemented in `track.json` (12 stages, 0–11). Legacy 8-stage folders archived under `_archive/`.

**Product model:** One track in this phase. **Track 2 (later)** = specialization — mobile, frontend, or backend depth. No sub-tracks inside Track 1.

**Audience:** Can already code (e.g. CS student: Java, C#, algorithms) but needs a **broad, end-to-end** picture of web-based systems — not framework mastery.

**Method:** One repo, one evolving app (student picks entity: workouts, recipes, etc.). Each stage adds capability. **Lesson → Sandbox → Quiz → Project** unchanged.

**Depth rule:** Cover topics **in the round** — enough to use them correctly and know what they are. Skip advanced rabbit holes (microservices, bundle splitting, lazy loading, etc.).

---

## Stage loop rules

### Quiz (max 5 questions)

- **Hard cap: 5 questions** per stage quiz. No exceptions in Track 1.
- **Every question must be answerable** from that stage’s **lesson pages** and **sandbox steps** only — no surprise topics, no “nice to know” tangents.
- Pick the **5 highest-signal checks**: one concept per lesson/sandbox cluster when possible; prefer what they need for the project checklist.
- **Pass threshold:** 80% (`passScore: 0.8`) → 4/5 correct. With only 5 questions, each one matters — write distractors from common mistakes seen in sandbox checkpoints.
- Sandbox checkpoint prompts are fair game for quiz reuse (rephrased, not copy-pasted verbatim if avoidable).

### Tooling before subject

When a stage introduces **professional tooling** (DevTools, Postman/curl, DB CLI/GUI, test runner, etc.), teach **how to use the tool first**, then the domain topic — students must be able to **validate** what they built.

| Stage | Tooling lesson(s) come **before** |
|-------|-----------------------------------|
| 0 | Tooling map before landscape deep-dive; Git/terminal before “choose project” |
| 2 | DevTools **Elements** before semantic HTML/CSS exercises |
| 3 | DevTools **Elements + Console** before DOM/CRUD lessons |
| 4 | **curl** (or API client) right after HTTP basics — before Express handlers |
| 5 | **DB CLI + GUI** before SQL CRUD and swap-from-in-memory |
| 6 | **Postman + Network tab** before fetch/CORS/UI wiring |
| 8 | **DB GUI** (schema view) before ORM/migration lessons |
| 9 | **Postman collection for auth endpoints** before JWT/RBAC theory depth |
| 11 | **Run tests locally** before CI/deploy (see failing test → fix → green) |

Rule of thumb: if the student would ask *“how do I know this worked?”*, the prior lesson page should have already shown the tool.

---

## Graduation skills (must-have checklist)

Student can **do and explain** each area below in the context of their own project.

### Git
- Common commands: `status`, `add`, `commit`, `push`, `pull`, `log`, `diff`, `switch` / `checkout`, `merge`
- Branching: feature branches, keeping `main` deployable
- Branching strategies (practical): feature branches + PRs; when `dev` makes sense later
- Pull requests: open, review, merge

### Frontend (vanilla — no React/Vue in Track 1)
- **HTML** — correct **semantic** structure (`header`, `main`, `form`, `label`, etc.)
- **CSS** — flexbox layout, **CSS variables**, **responsive** basics (works on narrow viewports)
- **JavaScript** — `querySelector`, dynamic DOM (create/update/remove “components” as elements)
- **Backend communication** — `fetch`, JSON, handling loading/error/success
- **Page navigation** — multi-view app (show/hide sections or multi-page) without a framework

### Professional tooling
Students know **which tool to reach for** — Track 1 uses JavaScript/Express/SQLite in projects, but tooling lessons name **transferable skills**:
- **Chrome DevTools** — Elements, Console, Network tab (debug frontend + inspect API calls from the browser)
- **API testing** — Postman, Insomnia, or Bruno (or `curl`); same workflow on any stack
- **Database inspection** — CLI + GUI (e.g. `sqlite3`, DB Browser for SQLite, or TablePlus / pgAdmin for Postgres)
- **Git** — already covered in Stage 1

### Backend
- **API architecture** — routes, handlers, thin separation (routes → logic → data access)
- **Request pipeline / middleware (concept)** — each request passes through a chain before the handler; Express `app.use()` is the JS implementation; same idea exists in ASP.NET, Java filters, etc.
- **HTTP status codes** — when `200`, `201`, `400`, `401`, `403`, `404`, `500`
- **Structured JSON responses** — consistent success/error shape (not ad-hoc strings)
- **DB connections** — pool / client lifecycle, config via **environment variables**
- **SQL first**, then **ORM** — same endpoints; swap implementation
- **Pagination & search** — list endpoints accept query params (`page`/`limit`, `q`); simple SQL `LIMIT`/`OFFSET` and `WHERE` filters

### Databases (relational)
- Tables, columns, types, primary keys
- **Timestamps** — why `created_at` / `updated_at` matter
- **One-to-many** and **many-to-many** (junction table)
- **Indexing** — what indexes do; when a query benefits
- SQL first: `SELECT`, `INSERT`, `UPDATE`, `DELETE`, `JOIN`, parameterized queries
- **Migrations** — versioned schema changes (files, not manual drift)
- **Seeding** — scripts to populate dev/test data reproducibly

### Authentication & authorization
- **Register / login** flows (UI + API)
- **JWT access tokens** + **refresh tokens** (why two tokens)
- **Role-based access** — e.g. `user` vs `admin`; protected routes return `401` / `403`

### Testing
- **Unit tests** — validation, pure functions, services without HTTP
- **Integration tests** — HTTP endpoints (supertest or equivalent), test DB

### End-to-end (implicit)
- App runs locally across UI + API + DB
- **Deployed** to public URLs (light deploy stage — env in prod, smoke test)

---

## Explicitly out of scope (Track 1)

Save for Track 2 specialization or never at intro level:

- **Accessibility (WCAG, screen readers, audit tools)** — Track 2 Frontend
- React, Vue, Angular, Svelte
- Mobile (React Native, Flutter)
- Microservices, message queues, complex backend topology
- Lazy loading, code splitting, bundle analysis
- GraphQL, gRPC
- Docker/Kubernetes depth
- OAuth “Sign in with Google/GitHub” (optional footnote only)
- E2E browser automation (Playwright/Cypress) — optional mention
- Advanced performance tuning, caching layers, CDN theory

---

## Track 1 — 12 stages (0–11)

| # | Slug (proposed) | Title | Covers |
|---|-----------------|-------|--------|
| 0 | `stage-0-onboarding` | Onboarding & the web stack | CommitLoop, **professional tooling overview**, web landscape, pick project |
| 1 | `stage-1-git` | Git & collaboration | Commands, branches, PR workflow, `.gitignore` |
| 2 | `stage-2-html-css` | HTML & CSS | Semantics, flexbox, CSS variables, **responsive layout** |
| 3 | `stage-3-javascript` | JavaScript & the DOM | Selectors, events, dynamic UI, mock CRUD; **Chrome DevTools** (Elements, Console) |
| 4 | `stage-4-api` | API architecture & HTTP | Express, REST, status codes, **structured responses**, **request pipeline / middleware**, env vars, in-memory store |
| 5 | `stage-5-sql` | Relational databases (SQL) | Tables, columns, **timestamps**, connections, parameterized SQL, SQLite; **inspect DB** (CLI + GUI) |
| 6 | `stage-6-fullstack-wire` | Wire frontend & backend | `fetch`, CORS, loading/error states; **Network tab**, **Postman/curl** |
| 7 | `stage-7-data-modeling` | Relations, search & pagination | **1:N**, **M:N**, joins, indexes; **`?page=` / `?q=` search** |
| 8 | `stage-8-orm` | ORM, migrations & seeding | ORM replaces raw SQL; **migration files** + **seed script** |
| 9 | `stage-9-auth` | Authentication & authorization | Register/login, **JWT + refresh**, password hashing, **RBAC** |
| 10 | `stage-10-frontend-app` | Frontend application | **Multi-view navigation**, auth screens, role-aware UI, **search UI** |
| 11 | `stage-11-ship` | Testing & deployment | Unit + integration tests, CI; deploy API + web; smoke test |

**Graduation artifact:** Public repo + live app + tests in CI + README describing stack and one architecture diagram.

---

## Project spine (what grows in the repo)

```text
0   repo, README, first push; tooling map (DevTools, Postman, DB GUI)
1   api/ + web/ folders; feature branch + merged PR
2   semantic HTML + flexbox + CSS variables + responsive (mobile-width OK)
3   JS CRUD on mock data; DevTools Elements/Console
4   Express API, in-memory, JSON envelope, .env; middleware chain (json parser, logger)
5   SQLite, timestamps, SQL in handlers; inspect DB with CLI/GUI
6   web/ uses fetch; Network tab + Postman/curl for same requests
7   related tables, M:N, index; GET list supports ?page= & ?q= search
8   ORM + migration files + seed script (dev data)
9   users table, JWT + refresh, RBAC on routes
10  login/register, app shell, navigation, search box wired to API
11  vitest + supertest; GitHub Actions; production URLs
```

Example domain (student choice): **Workouts** with **Categories** (M:N), **Users** with roles, `created_at` on everything.

---

## Stage notes (teaching intent)

### Stage 0 — Onboarding
- **Lesson order:** (1) How CommitLoop works → (2) **Tooling map** (editor, terminal, Git, DevTools, Postman, DB GUI) → (3) Web stack landscape diagram → (4) Choose project.
- Tooling map **before** landscape — students know *what they'll use to verify each layer* before the diagram names those layers.
- Assumes they can code; skips “what is a variable.”
- **Quiz (≤5):** CommitLoop flow, one-repo rule, Git vs GitHub, tooling purpose — all from lessons + onboarding sandbox.

### Stage 1 — Git
- Expand current `stage-1-git-fundamentals` if needed: PR flow, branching strategy prose.
- **Outcome:** daily Git habit, not one-time setup.

### Stage 2 — HTML & CSS
- **Lesson order:** (1) DevTools **Elements** (inspect/style live) → (2) Semantic HTML → (3) Flexbox → (4) CSS variables → (5) Responsive layout + static shell.
- **New content** vs today — current `stage-2-frontend` is JS-heavy, light on CSS.
- **Not in Track 1:** WCAG, screen readers, accessibility audits → Track 2 Frontend.
- Project: static shell that *looks* like an app on desktop and phone-width; validate layout in Elements.

### Stage 3 — JavaScript
- **Lesson order:** (1) DevTools **Elements + Console** → (2) What the DOM is → (3) Rendering data → (4) Forms & events → (5) Mock CRUD in memory.
- Sets up “components” as functions that return/update DOM — no JSX.
- Every sandbox step should be debuggable via Console; quiz pulls from DOM lessons + sandbox checkpoints.

### Stage 4 — API
- **Lesson order:** (1) Client, server, HTTP → (2) **curl** (first way to hit an endpoint) → (3) REST & resources → (4) Structured JSON responses + **middleware pipeline** → (5) Express routes + in-memory store → (6) Environment variables.
- Response envelope early: `{ data }` / `{ error: { code, message } }`.
- **`process.env`, `.env.example`, `PORT`, `DATABASE_URL` placeholder** in final lesson; student verifies routes with curl before any UI wire.
- Reuse much of `stage-3-rest-api`; split “connect UI” out to Stage 6.

### Stage 5 — SQL
- **Lesson order:** (1) **Inspect the DB** (CLI + GUI — open empty DB, run SELECT) → (2) Why persist → (3) Tables, rows, PKs → (4) Timestamps → (5) SQL CRUD + swap in-memory for SQLite.
- After every API write, student re-runs SELECT in CLI/GUI to confirm rows — habit starts here.
- Single main table; users/auth tables come later.

### Stage 6 — Wire
- **Lesson order:** (1) **Postman/curl** (save GET/POST collection) → (2) DevTools **Network tab** → (3) fetch + JSON → (4) CORS → (5) Loading/error states in UI.
- Student proves API with Postman *before* debugging fetch in the browser; Network tab explains what fetch is doing.
- Full request path before relations/auth complexity.

### Stage 7 — Data modeling
- Pull from `stage-7-expansion` relationships + new indexing lesson.
- M:N example required in project checklist.
- **Pagination:** `GET /workouts?page=1&limit=20` — SQL `LIMIT`/`OFFSET`.
- **Search:** `GET /workouts?q=run` — parameterized `WHERE name LIKE` (or `ILIKE` on Postgres); keep it simple, not full-text search engines.

### Stage 8 — ORM, migrations & seeding
- **Lesson order:** (1) **DB GUI — schema view** (tables/columns after migrations) → (2) Why ORMs exist → (3) ORM queries (same routes, new layer) → (4) Migration files → (5) Seed scripts.
- **New stage** — not in shipped track.
- Never “just edit the DB by hand”; after each migration, refresh GUI and confirm schema.
- Project checklist: at least **2 migrations** (initial + one alter) and **one seed script**.

### Stage 9 — Auth
- **Lesson order:** (1) **Postman — register/login/refresh collection** → (2) Auth basics + password hashing → (3) JWT access tokens → (4) Refresh tokens → (5) RBAC + auth middleware.
- Pull from `stage-7-expansion` auth content; extend for **refresh tokens** + **RBAC**.
- Backend-first: endpoints proven in Postman before Stage 10 UI.

### Stage 10 — Frontend app
- **Client-side navigation** (tabs, hash routes, or multi-page — student choice).
- Login gate: redirect unauthenticated users.
- Hide admin actions when role !== `admin`.
- **Search UI** — input debounced or on submit, calls paginated/search API from Stage 7.

### Stage 11 — Ship
- **Lesson order:** (1) **Run tests locally** (watch one fail, fix, pass) → (2) Why tests / unit tests → (3) Integration tests (auth, pagination, relations) → (4) Deploy API + web → (5) CI + smoke test.
- Merge `stage-6-testing` + `stage-5-deployment`.
- Tests must cover auth sad paths (`401`, `403`), pagination/search query params, and one relation query.
- Quiz: mix of “what to test” from lessons + sandbox assertions (e.g. arrange/act/assert, sad-path status codes).

---

## Track 2 (future — not this phase)

After Track 1, student picks **one** specialization track (same repo continues):

| Track 2 | Example depth |
|---------|----------------|
| **Frontend** | React/Vue rewrite, state management, **accessibility (WCAG, audits)**, UI testing |
| **Backend** | Layered architecture, caching, OpenAPI, Postgres ops |
| **Mobile** | React Native / Expo consuming existing API |

Track 1 must **not** require picking a Track 2 path to graduate.

---

## Current repo vs this spec

| Shipped today (`track.json`) | This spec |
|------------------------------|-----------|
| 8 stages (0–7) | 12 stages (0–11) |
| Thin CSS | Dedicated HTML/CSS stage |
| No ORM stage | Stage 8 ORM |
| Auth in expansion stage 7 | Stages 9–10 auth + auth UI |
| No relations/indexing focus | Stage 7 explicit |
| No structured API responses | Stage 4 explicit |
| Deploy + testing separate | Combined in stage 11 |
| `_archive/stage-5-structure` | Ideas folded into stages 4, 6, 8 (light layering) |

**Reuse:** ~60% of existing markdown can be split, moved, or extended. **New writing:** stages 2, 8, 10, landscape + tooling in 0, responsive CSS, middleware-as-concept, pagination/search, migrations/seeding, DevTools/Postman/DB GUI lessons, timestamps/indexing/M:N depth, refresh tokens, RBAC.

---

## Tooling lessons (where they land)

| Tool | Stage | Outcome |
|------|-------|---------|
| Chrome DevTools — Elements | 2–3 | Inspect HTML/CSS; see DOM updates after JS |
| Chrome DevTools — Console | 3 | Read errors; debug with `console.log` |
| Chrome DevTools — Network | 6 | See fetch requests, status codes, JSON bodies |
| Postman / Insomnia / Bruno | 6 | Test API without UI; save requests; share collection |
| `curl` | 4, 6 | Quick terminal checks; works everywhere |
| DB CLI (`sqlite3`, `psql`) | 5 | Run SQL directly; verify API writes |
| DB GUI (DB Browser, TablePlus, pgAdmin) | 5, 8 | Visual schema + rows; inspect after migrations |

Track 1 exercises use **Express + SQLite** — students who later pick **.NET** or **Java** reuse the same tools (Postman, DB GUI, DevTools for any frontend) and the same **concepts** (middleware pipeline, migrations, JWT).

---

## Content work order (suggested)

1. Lock stage slugs and `track.json` (12 entries).
2. Stage 0 — landscape + tooling map.
3. Split stage 2 → HTML/CSS (responsive) + stage 3 JS (DevTools).
4. Extend stage 4 — structured responses + **middleware as concept** + Express examples.
5. Extend stage 5 — timestamps + DB inspection; stage 7 — pagination + search.
6. Write stage 8 — ORM + **migrations + seeding** (explicit project steps).
7. Extend stage 9–10 — JWT refresh + RBAC + navigation + search UI.
8. Stage 6 — Postman + Network tab lesson.
9. Merge deploy + testing → stage 11.
10. Archive old `stage-7-expansion`; absorb auth/relations/search pieces.
11. `npm run content:check` + walk one stage yourself.

---

## Platform copy (when implemented)

> **Track 1 — Web Systems:** One app, every layer — Git, UI, API, SQL, ORM, auth, tests, deploy. Broad strokes so you can specialize later.
