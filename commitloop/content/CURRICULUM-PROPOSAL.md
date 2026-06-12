# CommitLoop Curriculum Proposal

**Status:** Draft for discussion — not yet implemented in `track.json`.

**Audience for Track 1:** Students who can already program (e.g. 2nd-year CS: Java, C#, algorithms) but do not yet understand web development, professional tooling, or how to choose frontend vs backend depth.

**Design principles (informed by TOP, MDN, Full Stack Open, freeCodeCamp, Codecademy):**

1. **Map before maze** — explain the whole field before specializing.
2. **Breadth over depth in Track 1** — touch many concepts thinly; master them in Track 2+.
3. **One repo, evolving app** — same project throughout; each stage adds a *room*, not a reset.
4. **Transferable spine** — HTTP, REST, JSON, auth *ideas*, Git, env vars, validation taught as shared vocabulary.
5. **Multiple competencies, not one CRUD** — graduates can *name* what they learned.
6. **Explicit fork** — Track 1 ends with an informed Track 2 choice.

---

## Track overview

| Track | Title | Promise |
|-------|-------|---------|
| **Track 1** | Web Fundamentals | Understand what web development is, use daily tools, build one app through every layer, deploy and test it, choose what to learn next. |
| **Track 2 — Frontend** | Frontend Depth | Same app: polish vanilla JS → React (or Vue) → state → routing → UI testing. |
| **Track 2 — Backend** | Backend Depth | Same app: layered API → real auth → migrations → caching → OpenAPI. |
| **Track 2 — Product** | Growing the System | Auth, user-scoped data, relationships, pagination (current stage-7 content). |
| **Track 2 — Structure** | Maintainable Code | Validation, layering, refactors (archived `stage-5-structure`). |

Tracks 2 can be taken in any order after Track 1. All use the same student repo.

---

## Track 1 — Web Fundamentals (12 stages)

**Graduation artifact:** Live HTTPS app + GitHub repo + CI green + README with architecture diagram + written Track 2 choice.

**Graduation competencies (student can explain each):**

- How a browser request becomes a response (DNS, HTTP, JSON)
- What REST is and why APIs look the way they do
- What frontend vs backend vs database each own
- Git workflow (branch, PR, meaningful commits)
- DevTools Network tab and `curl` for debugging
- Why validation exists on server and client
- Sessions vs tokens (conceptually)
- Why tests and CI exist

### Stage 0 — Enter the profession

**Goal:** Working environment + mental map of web development.

**Teach:** How CommitLoop works; roles (frontend, backend, full-stack, DevOps); how the web works (browser, server, DB); pick project idea.

**Project delta:** Repo created, README with “what I’m building,” first commit pushed.

**Inspired by:** FSO Part 0, Codecademy “Overview of Web Development,” TOP “How Does the Web Work?”

---

### Stage 1 — Git & collaboration

**Goal:** Git as a daily tool, not a one-time setup.

**Teach:** Staging, commits, branches, feature-branch → PR → merge; commit messages; `.gitignore`.

**Project delta:** `api/` + `web/` scaffold; one PR merged.

**Reuse:** Current `stage-1-git-fundamentals` (minor tone tweak for CS audience).

---

### Stage 2 — The web UI

**Goal:** Frontend literacy — structure, style, interaction — without a backend.

**Teach:** Semantic HTML; CSS fundamentals + **layout (flexbox)**; DOM & events; mock data; empty states.

**Project delta:** Styled page that lists and creates records from an in-browser array. Looks intentional, not a raw `<table>`.

**Gap vs today:** Add CSS/layout stage weight (MDN modules 2–5, TOP Flexbox + landing page).

**Reuse:** `stage-2-frontend` + new CSS lessons.

---

### Stage 3 — HTTP & the API

**Goal:** Shared language for all web dev — HTTP, REST, JSON.

**Teach:** Request/response, methods, status codes; Express routes; in-memory store; **`curl` + DevTools Network** debugging.

**Project delta:** API on :3001; `GET`/`POST` on in-memory data; tested with curl before UI wiring.

**Reuse:** `stage-3-rest-api` + explicit tooling lesson.

---

### Stage 4 — Data & persistence

**Goal:** Why databases exist; SQL as the persistence layer.

**Teach:** Tables, keys, CRUD, parameterized queries; SQLite; swap in-memory → SQL.

**Project delta:** Data survives API restart.

**Reuse:** `stage-4-database`.

---

### Stage 5 — Contracts & structure

**Goal:** Professional discipline — validation, errors, thin layering.

**Teach:** Never trust the client; `400` vs `500`; separate route / handler / data access; frontend loading & error states.

**Project delta:** Invalid input rejected; API folders extracted; UI shows loading/error.

**Reuse:** `_archive/stage-5-structure` (lightened — refactor, not rewrite).

---

### Stage 6 — Auth & security (concepts)

**Goal:** Understand authentication and security — shared FE/BE vocabulary.

**Teach:** Authentication vs authorization; sessions vs JWT (ideas); cookies; CORS; env secrets; password hashing (concept).

**Project delta:** Minimal auth stub (e.g. hardcoded user or session cookie) OR protected route returning `401` without login — **not** production OAuth.

**Move from:** Current `stage-7-expansion` auth lessons (thin version).

**Inspired by:** FSO Part 4 (token auth), Codecademy security module (conceptual).

---

### Stage 7 — Data modeling

**Goal:** Real apps have shape — relationships, not one table.

**Teach:** Foreign keys, `JOIN`, second entity (e.g. categories); optional user scoping preview.

**Project delta:** Second table + FK; list shows related data.

**Move from:** `stage-7-expansion` relationships content.

---

### Stage 8 — Connect & polish the slice

**Goal:** Wire UI ↔ API ↔ DB with async UX.

**Teach:** `fetch` patterns; re-render; empty/loading/error/success states; “why frameworks exist” preview (no React yet).

**Project delta:** End-to-end flow feels like a product; short lesson on React/Vue/Angular landscape.

**Reuse:** Parts of `stage-2-frontend` connect lesson + structure stage UI state.

---

### Stage 9 — Deployment

**Goal:** Software runs somewhere other than localhost.

**Teach:** Env vars, builds, host API + web, prod CORS, Postgres in prod, smoke tests.

**Project delta:** Live URLs in README.

**Reuse:** `stage-5-deployment`.

---

### Stage 10 — Testing & CI

**Goal:** Quality is automated, not manual clicking.

**Teach:** Unit vs integration tests; supertest; sad paths; GitHub Actions gate.

**Project delta:** `npm test` in CI; badge or screenshot in README.

**Reuse:** `stage-6-testing`.

---

### Stage 11 — Choose your path

**Goal:** Informed specialization — Track 2 selection.

**Teach:** Framework landscape; frontend vs backend career paths; what Track 2 options cover; soft skills (reading docs, debugging across layers).

**Project delta:** README “Architecture” section (ASCII or mermaid diagram); written paragraph: which Track 2 and why.

**Inspired by:** TOP “Choose Your Path Forward,” MDN Extensions intro.

**Assessment:** Quiz on the map + project checklist (no new code feature required).

---

## Track 1 project spine (one app, growing)

```text
Stage 0   repo + README
Stage 1   api/ web/ + git workflow
Stage 2   styled UI + mock CRUD
Stage 3   + Express in-memory API
Stage 4   + SQLite persistence
Stage 5   + validation, layers, UI states
Stage 6   + auth stub / 401 gate
Stage 7   + second table + FK
Stage 8   + polished async UX + framework preview
Stage 9   + production deploy
Stage 10  + tests + CI
Stage 11  + architecture doc + Track 2 choice
```

Same entity throughout (workouts, recipes, etc.) — but the **app grows in conceptual surface area**, not just row count.

---

## Track 2 — Frontend Depth (example)

**Prerequisite:** Track 1 complete.

| Stage | Title | Project delta |
|-------|-------|----------------|
| 0 | Modules, bundler, TypeScript optional | Organized `web/` src |
| 1 | React rewrite | Same features, components |
| 2 | State when it hurts | Context or Zustand |
| 3 | Routing & forms at scale | Multi-page flow |
| 4 | UI testing | RTL or Playwright on critical path |

Alternative branch: Vue or Angular instead of React (same stage shape, different lessons).

---

## Track 2 — Backend Depth (example)

| Stage | Title | Project delta |
|-------|-------|----------------|
| 0 | Layered API | routes / services / repos |
| 1 | Real authentication | sessions or JWT end-to-end |
| 2 | Migrations & Postgres | schema evolution |
| 3 | Caching & performance basics | optional Redis |
| 4 | OpenAPI & contract tests | documented API |

---

## Track 2 — Product Growth

Move current **`stage-7-expansion`** here in full: user-scoped data, pagination, incremental feature branches.

---

## What changes from current `track.json`

| Current | Proposal |
|---------|----------|
| 8 stages (0–7) | 12 stages (0–11) |
| Stage 7 = expansion in Track 1 | Expansion → Track 2 Product |
| Structure archived | Structure → Track 1 stage 5 + Track 2 optional |
| Thin CSS / no landscape | Stages 0 & 2 add map + layout |
| Auth at end / optional | Auth concepts in Track 1 stage 6 |
| No graduation fork | Stage 11 explicit |

---

## Content reuse map

| Existing folder | Proposal |
|-----------------|----------|
| `stage-0-onboarding` | Stage 0 (+ new landscape lesson) |
| `stage-1-git-fundamentals` | Stage 1 |
| `stage-2-frontend` | Stages 2 & 8 (split UI vs connect) |
| `stage-3-rest-api` | Stage 3 |
| `stage-4-database` | Stage 4 |
| `_archive/stage-5-structure` | Stage 5 |
| `stage-5-deployment` | Stage 9 |
| `stage-6-testing` | Stage 10 |
| `stage-7-expansion` | Track 2 Product (+ thin parts → stages 6–7) |

---

## Platform copy (Track 1 subtitle)

> **Track 1 — Web Fundamentals:** For students who can code but don’t yet speak web. One app, every layer, daily tools, live deploy — then choose your depth.

---

## Open questions

1. **CS audience tone** — skip “what is a variable” everywhere; assume IDE comfort.
2. **Stage count** — 12 may feel long; could merge 6+7 or 9+10 if we want 10 stages.
3. **React in Track 1?** — Proposal says no; preview only in stage 8. React is Track 2 Frontend stage 1.
4. **Mongo vs SQL in Track 1** — keep SQLite for simplicity; Postgres at deploy (current deployment content).

---

## Next implementation steps

1. Approve stage list and graduation competencies.
2. Update `track.json` and create/rename stage folders.
3. Write new content: landscape (0), CSS layout (2), tooling (3), choose-path (11).
4. Split/merge existing markdown per reuse map.
5. Run `npm run content:check` and update tests.
6. Add Track 2 stubs to `content/track-2/` when ready.
