# Curriculum gap analysis — Track 1 vs peer platforms

**Date:** 2026-07-05  
**Compares:** [CommitLoop Track 1 spec](./CURRICULUM-PROPOSAL.md) vs curricula aimed at **broad web / full-stack fundamentals** (not specialization tracks).

**Peer sources reviewed:**

| Platform | What we compared | Best for |
|----------|------------------|----------|
| [The Odin Project](https://www.theodinproject.com/paths) | Foundations + Databases + NodeJS courses | Free, project-heavy, vanilla → Express → Postgres → Prisma |
| [Full Stack Open](https://fullstackopen.com/en/) (Helsinki) | Parts 0–5 core | CS-capable audience, one evolving app, React-heavy |
| [freeCodeCamp](https://www.freecodecamp.org/learn/) | RWD + Relational Database + BE APIs + QA certs | Modular certs, SQL cert separate from Node cert |
| [Codecademy](https://www.codecademy.com/learn/paths/full-stack-engineer-career-path) | Full-Stack + Back-End Engineer paths | Structured modules, Postgres + auth + TDD |
| [MDN Curriculum](https://developer.mozilla.org/en-US/curriculum/core/) | Core + Extensions | Frontend standards, a11y, tooling |
| [Boot.dev](https://www.boot.dev/paths/backend) | HTTP Clients/Servers + SQL courses | Backend literacy, auth/authz chapters |
| [CS50 Web](https://cs50.harvard.edu/web/) | 9-week syllabus | University pacing, SQL-before-ORM, auth + testing |

---

## 1. Topic coverage matrix

Legend: **●** taught explicitly · **◐** partial / project-only · **○** missing or extension-only · **—** intentionally N/A for that platform

| Topic | CommitLoop spec | TOP | FSO 0–5 | fCC (combo) | Codecademy FS/BE | MDN Core | Boot.dev | CS50 Web |
|-------|-----------------|-----|---------|-------------|------------------|----------|----------|----------|
| **Git + PR workflow** | ● | ● | ◐ assumes | ● (DB cert) | ● | ● | ● | ● |
| **HTML semantics** | ● | ● | ◐ | ● | ● | ● | — | ● |
| **CSS flexbox** | ● | ● | ◐ | ● + grid | ● | ● | — | ● |
| **CSS variables** | ● | ◐ | ○ | ◐ | ◐ | ◐ | — | ◐ |
| **Responsive layout** | ○ | ● | ◐ | ● | ● | ● | — | ● |
| **JS DOM / events** | ● | ● | ● (React) | ● | ● | ● | — | ● |
| **fetch + JSON** | ● | ◐ | ● | ◐ | ● | ◐ ext | ● clients | ● |
| **Client navigation (no framework)** | ● | ◐ | ○ (React Router later) | ◐ | ◐ | ◐ | — | ● |
| **HTTP methods / status codes** | ● | ◐ | ● | ● | ● | ◐ | ● | ● |
| **REST / API design** | ● | ● | ● | ● | ● | ◐ | ● | ● |
| **Structured API responses** | ● | ◐ | ◐ | ◐ | ◐ | ○ | ◐ errors | ◐ |
| **Express / route architecture** | ● | ● MVC | ● | ● | ● | ○ | ● | ◐ Flask/Django |
| **Middleware** | ◐ | ● | ● | ● | ● | ○ | ● | ● |
| **Env variables** | ● | ● | ● | ● | ● | ◐ | ● | ● |
| **SQL CRUD + parameterized queries** | ● | ● | ◐ Mongo core | ● separate cert | ● | ○ | ● | ● raw SQL |
| **Timestamps (created_at etc.)** | ● | ◐ | ◐ | ◐ | ◐ | ○ | ◐ | ◐ |
| **1:N relationships** | ● | ◐ | ◐ | ● | ● | ○ | ● joins | ● |
| **M:N + junction tables** | ● | ◐ | ○ | ● design course | ● | ○ | ◐ | ● |
| **Indexing** | ● | ◐ | ○ | ● design course | ● optimization | ○ | ◐ | ○ |
| **SQL → ORM swap** | ● | ● Prisma | ○ Mongoose | ○ Mongoose | ● Sequelize | ○ | ○ | ● Django ORM later |
| **DB connection pooling** | ● | ● pg Pool | ◐ | ◐ | ● | ○ | ● | ◐ |
| **Register / login** | ● | ● Passport | ● | ◐ | ● | ○ | ● | ● |
| **JWT access tokens** | ● | ● | ● | ◐ | ● | ○ | ● | ◐ |
| **Refresh tokens** | ● | ◐ | ○ noted gap | ○ | ◐ | ○ | ◐ | ○ |
| **RBAC / admin roles** | ● | ● Members Only | ◐ | ◐ | ● | ○ | ● authz | ● |
| **Password hashing** | ● | ● bcrypt | ● | ◐ | ● | ○ | ● | ● |
| **Unit tests** | ● | ◐ | ● | ● QA cert | ● | ◐ ext | ◐ | ● |
| **HTTP integration tests** | ● | ● | ● supertest | ● | ● SuperTest | ◐ ext | ◐ | ● |
| **Deploy live app** | ● | ● | ● | ◐ | ● | ◐ ext | ● Docker later | ● |
| **CI pipeline** | ● | ◐ | ◐ ext part 11 | ◐ | ● | ◐ ext | ◐ | ● |
| **CORS** | ● | ● | ● | ◐ | ● | ○ | ◐ | ◐ |
| **Accessibility** | ○ | ○ | ○ | ● RWD | ◐ | ● core | — | ◐ |
| **Pagination** | ○ | ◐ projects | ◐ | ◐ | ◐ | ○ | ◐ | ● |

---

## 2. How peers structure a “similar course”

### The Odin Project (closest free analogue)

**Shape:** Foundations (HTML/CSS/JS, **4 JS projects**, flexbox landing page) → choose path → **SQL course** (2 lessons + SQL Zoo) → **Node** (Express MVC, Postgres, **Passport auth**, **Prisma ORM**, API security, **testing**, 6+ projects).

**Takeaway:** Heavy **frontend project count** before backend; **ORM + auth + testing** are separate project milestones, not one CRUD tutorial.

### Full Stack Open (closest CS-student analogue)

**Shape:** Part 0 = **web fundamentals essay** (HTTP, forms, DOM) → Parts 1–2 **React** → Part 3 Express + **MongoDB** + deploy → Part 4 **testing + JWT auth** → Part 5 React auth + E2E.

**Takeaway:** Strong **testing + JWT** in core; **weak on relational SQL, M:N, indexing, refresh tokens**; **React required**, not vanilla.

### freeCodeCamp (modular certs ≈ one broad track if combined)

**Shape:** RWD (HTML/CSS/a11y/grid) + **Relational Database cert** (SQL, FKs, bash) + **BE APIs** (Express, middleware, `.env`, **Mongoose**) + **QA** (Mocha/Chai).

**Takeaway:** **Splits SQL and Node across certs**; relational depth is strong in DB cert; **ORM taught as Mongoose (NoSQL)**, not SQL ORM; many **small microservices**, not one repo.

### Codecademy Full-Stack / Back-End paths

**Shape:** Web fundamentals → JS → React (FS) → Express + **Postgres design** → connect FE/BE → **security (OAuth, JWT, cookies)** → **TDD** → deploy/DevOps touch.

**Takeaway:** **Auth + DB design + testing** explicit; **Sequelize ORM**; still **React-centric** on full-stack path.

### MDN Curriculum

**Core:** web standards, HTML, CSS (incl. layout), JS, **accessibility**, design for devs, **Git**.  
**Extensions:** security, **testing**, frameworks, performance.

**Takeaway:** **Accessibility is core**; backend/API/DB/auth **not in core** — assumed elsewhere.

### Boot.dev (backend literacy slice)

**Shape:** Python/TS basics → **HTTP Clients** → **SQL** (joins, constraints) → **HTTP Servers** (routing, architecture, JSON, storage, **authentication**, **authorization**).

**Takeaway:** Excellent **ordering**: HTTP → SQL → HTTP servers with auth; **not a full frontend track**.

### CS50 Web

**Shape:** HTML/CSS → Git → Python → Django → **SQL raw first** → JavaScript → **social network project** (relations, fetch, pagination, auth) → **Testing & CI/CD** → security/scalability.

**Takeaway:** **University one-semester arc**; **pagination + social graph**; SQL before ORM; **Django** not Express but same ideas.

---

## 3. CommitLoop spec vs consensus

### Where your plan **matches or beats** peers

| Your requirement | Industry norm | Verdict |
|------------------|---------------|---------|
| SQL before ORM | TOP (Prisma), CS50 (raw SQL), Codecademy (SQL then Sequelize) | **Aligned** — better than FSO/fCC BE-only Mongoose path |
| JWT + login/register | Universal in Part 4+ / Node courses | **Aligned** |
| **Refresh tokens** | Often skipped (FSO reviewers note this gap) | **Ahead of FSO core** — keep if you can teach it simply |
| **RBAC** | TOP “Members Only”, Boot.dev authz, Codecademy | **Aligned** — good |
| **1:N + M:N + indexing** | Strong in fCC DB design; weak in FSO/TOP intro | **Ahead of most intro full-stack courses** |
| **Structured JSON responses** | Rarely a dedicated lesson | **Ahead** — good differentiator |
| **Timestamps as concept** | Often implicit in schemas | **Good explicit choice** |
| Vanilla JS + **page navigation** | TOP/CS50 yes; FSO/Codecademy mostly React | **Good for “broad stroke” before Track 2** |
| Unit + integration tests | FSO P4, TOP, fCC QA, CS50 W7 | **Aligned** |
| One repo, gated progression | Unique to CommitLoop | **Differentiator** — not a gap |
| Deploy + env in prod | Universal late-stage | **Aligned** |

### Gaps — peers teach it, **your spec is light or silent**

| Gap | Who teaches it | Severity | Recommendation |
|-----|----------------|----------|----------------|
| **Accessibility (a11y)** | MDN core, fCC RWD | **Medium** | Add to Stage 2 checklist: labels, `alt`, focus states, one lesson page |
| **Responsive / mobile-first CSS** | TOP, fCC, MDN | **Medium** | Add flexbox + **one** responsive patterns lesson (media queries); skip grid mastery |
| **CSS Grid** | fCC, MDN | Low | Optional callout in Stage 2; flexbox enough for Track 1 |
| **Middleware** (logging, parse JSON, auth gate) | fCC BE, TOP Express | **Medium** | One lesson in Stage 4 — `express.json()`, auth middleware preview |
| **Input validation / sanitization** | TOP, FSO, CS50 security | **Medium** | Stage 5 or 4 — server-side validation before auth |
| **Pagination** | CS50 Network, FSO, your old stage 7 | **Medium** | Add to Stage 7 or 10: `?page=&limit=` — common in real APIs |
| **Error-handling pattern** (async errors, central handler) | Express courses | Low | One subsection in Stage 4 |
| **API docs / OpenAPI** | Boot.dev docs chapter | Low | Footnote only — Track 2 backend |
| **Helmet / security headers** | fCC InfoSec, Codecademy | Low | One sandbox question in Stage 9 |
| **CLI & DevTools depth** | TOP Foundations | **Medium** | Stage 0 or 3: Network tab, `curl`, reading server logs |
| **Migrations** | ORM courses | Low | Stage 8 — one project step (you mention “basics”) — **ensure checklist item** |
| **Refresh token rotation / revoke** | Advanced auth | Low | Teach refresh **pair** only; skip rotation (matches “broad not advanced”) |
| **E2E / browser tests** | FSO P5 | — | Correctly out of scope |
| **Frameworks (React)** | FSO, Codecademy | — | Correctly Track 2 |

### Gaps — **your spec includes**, peers often defer (strengths to keep)

- Explicit **ORM stage** after SQL (not Mongoose-on-Mongo bait-and-switch)
- **M:N + indexing** as graduation requirements
- **Refresh tokens + RBAC** together
- **Multi-view vanilla navigation** before frameworks
- **Structured response envelope** for APIs

---

## 4. Stage-by-stage cross-check (proposed 12 stages)

| Stage | Peer analogue | Gap / action |
|-------|---------------|--------------|
| **0 Onboarding** | FSO P0, TOP “How the web works” | Add DNS/request lifecycle diagram; CLI/DevTools intro |
| **1 Git** | TOP, MDN #9, CS50 W1 | Strong — match TOP PR depth |
| **2 HTML/CSS** | TOP Foundations, fCC RWD | **Add a11y + responsive**; CSS variables ✓ |
| **3 JavaScript** | TOP 4 projects worth of DOM | Enough if project is non-trivial; add DevTools debugging |
| **4 API** | Boot.dev HTTP Servers ch 1–4, fCC Express | Add **middleware** + **response envelope** + validation intro |
| **5 SQL** | fCC relational, TOP SQL | Add **timestamps** lesson; connection pool/`DATABASE_URL` |
| **6 Wire** | FSO P2, Codecademy connect | CORS + Network tab — already planned |
| **7 Data modeling** | fCC DB design, CS50 Network models | **Add pagination** query params; indexing lab |
| **8 ORM** | TOP Prisma, Codecademy Sequelize | **Migrations** in project checklist |
| **9 Auth** | FSO P4, TOP Passport, Boot.dev ch 6–7 | Refresh tokens — keep; add bcrypt explicitly |
| **10 Frontend app** | CS50 Network (fetch + views) | Navigation + role-aware UI ✓ |
| **11 Ship** | FSO P4+P3 deploy, CS50 W7 | Split time: tests **before** deploy smoke test |

---

## 5. Recommended spec updates (minimal)

Add to **CURRICULUM-PROPOSAL.md** graduation checklist:

**Frontend**
- [ ] Basic **accessibility**: semantic forms, labels, keyboard-focus visible
- [ ] **Responsive** layout (works on narrow viewport — flex + one breakpoint)

**Backend**
- [ ] **Middleware** chain: JSON parser, auth guard, error handler (conceptual)
- [ ] **Pagination** on list endpoint (`limit` / `offset` or `page`)

**Stage 2** — add lesson: Accessibility & responsive basics  
**Stage 4** — add lesson: Middleware & consistent errors  
**Stage 7** — add lesson: Pagination  
**Stage 8** — project checklist: at least one **migration**

Optional footnote in Stage 9: security headers (Helmet) — not a full lesson.

---

## 6. What NOT to add (scope creep)

Peers often include these; your spec correctly deferrals:

- React / Vue / Angular (Track 2 Frontend)
- GraphQL, WebSockets, microservices
- Docker/K8s beyond deploy “click to host”
- E2E Playwright/Cypress
- OAuth social login
- Normal forms / BCNF theory
- Caching, Redis, CDN
- Bundle splitting, lazy loading

---

## 7. Summary scorecard

| Dimension | vs peers |
|-----------|----------|
| Git | On par with TOP/Codecademy |
| HTML/CSS | **Gap:** a11y + responsive vs MDN/fCC |
| JS/DOM | On par if Stage 3 project is substantial |
| HTTP/API | **Strong** if structured responses + middleware added |
| SQL/relations/indexing | **Stronger than FSO/TOP intro** |
| ORM after SQL | **Aligned with best practice** (TOP/Codecademy) |
| Auth | **Strong**; refresh tokens ahead of FSO |
| Testing | On par with FSO P4 / fCC QA (skip E2E) |
| Deploy/CI | On par |
| One evolving app | **Unique** — peers use many small projects |
| Vanilla before framework | **Rare** — good for your CS → choose Track 2 story |

**Bottom line:** Your planned curriculum is **directionally right** and in places **deeper than typical intro full-stack courses** (relations, indexing, ORM ordering, refresh+RBAC). The main **gaps vs peers** are **accessibility**, **responsive CSS**, **middleware/pagination**, and **DevTools/CLI literacy** — all fixable with ~4 lesson pages, not a restructure.

---

## 8. Sources

- [TOP Foundations course list](https://www.theodinproject.com/paths/foundations/courses/foundations)
- [TOP NodeJS course](https://www.theodinproject.com/paths/full-stack-javascript/courses/nodejs)
- [Full Stack Open Part 4–5](https://fullstackopen.com/en/part4/)
- [freeCodeCamp cert list](https://www.freecodecamp.org/news/freecodecamp-certifications/)
- [MDN Core + Extensions](https://developer.mozilla.org/en-US/curriculum/core/)
- [Boot.dev HTTP Servers syllabus](https://www.boot.dev/paths/backend)
- [CS50 Web weeks](https://cs50.harvard.edu/web/weeks/)
- [Codecademy path changes blog](https://www.codecademy.com/resources/blog/changes-to-the-web-development-career-path/)
