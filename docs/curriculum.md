# CommitLoop — Curriculum System

## Overview

CommitLoop is organized as **multiple curriculum tracks**. Each track is a complete apprenticeship path with its own scope, stack, and graduation outcome.

Every track shares the same execution model:

- One evolving project per student (no resets)
- Lesson → Sandbox Task → Project Implementation
- Git from Day 1
- One meaningful commit per day
- GitHub as the source of truth

The objective is never to complete lessons. The objective is to **build and evolve a real system** while developing professional engineering habits.

---

## Track Catalog

| Track | Name | For who | Stack focus | Prerequisite |
|-------|------|---------|-------------|--------------|
| **Track 1** | Fundamentals | Doesn't know what to specialize in yet; needs breadth | Full-stack (DB, REST API, web UI) | None |
| **Track 2** | Frontend & React | Knows they want frontend / React career path | HTML/CSS/JS → React → React Native | None |
| **Track 3+** | TBD | Specialized paths (backend, DevOps, etc.) | Per track | Per track (if any) |

Tracks are **independent entry points**. Track 1 is not required before Track 2. Students pick the track that matches their goal — not a prescribed sequence.

---

## Track Selection

### Choose Track 1 if you:

- Are new to software engineering or career-switching
- Have done tutorials but never shipped a complete app
- Don't know whether you want frontend, backend, or mobile
- Want breadth: databases, APIs, deployment, and full-stack thinking

### Choose Track 2 if you:

- Already know you want a frontend / React career
- Want to go deep on UI: vanilla web → React → React Native
- Don't care about building a backend right now (or ever, on this track)
- May have done Track 1, or may never do it — both are fine

Tracks do not gate each other. Completing Track 2 does not require Track 1. Completing Track 1 does not require Track 2.

Students may enroll in multiple tracks over time. Each track uses a **new repository** — but within a track, the same no-reset rule applies.

---

## Shared Principles (All Tracks)

- Learning is driven by building
- Every concept is immediately applied
- Theory is kept concise and practical
- One evolving project per track (no restarts mid-track)
- Refactors and migrations are valid progress — not failures
- Deployment happens early where applicable
- Consistency is valued over intensity

---

## Core Learning Loop (Mandatory)

Every unit in every track follows this sequence.

### 1. Lesson

Introduce the concept. Explain why it exists and where it is used. Short, practical, reference material — no long lectures.

### 2. Sandbox Task

Practice in isolation. Small scope, disposable, focused on one skill.

### 3. Project Implementation

Apply inside the student's evolving project. Must integrate with previous work. No restarting allowed.

---

## Git Rules (All Tracks)

- Maintain a dedicated GitHub repository per track
- Commit work continuously
- Avoid project restarts within a track
- Build incrementally
- Minimum: one meaningful commit every day

Acceptable commits: features, refactors, bug fixes, documentation, tests, migrations.

---

## Accountability Model (All Tracks)

GitHub is the source of truth. Progress is measured through commit activity, assignment completion, and project evolution. Communication occurs through Discord. Mentors answer questions, review selected work, and provide guidance — they do not complete work for students.

---

# Track 1 — Fundamentals

**Purpose:** Give students breadth. By the end, they can build, deploy, test, and evolve a full-stack application — and they'll know what direction they want to go next.

Students who don't yet know what they want to learn start here.

---

## Student Project Model

Every student builds one full-stack application:

- Relational database
- REST API backend
- Web frontend

Students choose their own domain (e-commerce, booking, finance tracker, inventory, etc.). Domain affects entities, business logic, and UI — not curriculum structure or engineering requirements.

---

## Progression

### Stage 0 — Onboarding

Enter a working engineering environment: GitHub, repository, local setup, first commit.

### Stage 1 — Git Fundamentals

Develop daily engineering habits. Git basics, commits, pushes, repository workflow. First meaningful project commit.

### Stage 2 — First End-to-End System

Build a complete vertical slice: database, REST API, frontend API consumption, CRUD. One table, GET/POST endpoints, simple UI.

### Stage 3 — System Structure

Improve maintainability: validation, API organization, frontend state, feature branching. Refactor architecture in the existing project.

### Stage 4 — Deployment

Deploy frontend and backend to production. Environment variables, build process, hosting.

### Stage 5 — Testing

Unit, integration, and end-to-end tests added to the existing application.

### Stage 6 — Expansion Loop

Evolve continuously: auth, authorization, relationships, search, pagination, file uploads, refactoring. Each topic follows Lesson → Sandbox → Project.

---

## Track 1 — Success Criteria

A student succeeds when they can:

- Build a full-stack application
- Use Git confidently
- Design a database and build REST APIs
- Deploy software and write tests
- Evolve an existing system without restarting

**Graduation outcome:** A deployed full-stack application, real Git history, practical engineering habits.

**Typical next step:** Another track (e.g. Frontend, Backend) if the student wants to specialize further — optional, not required.

---

# Track 2 — Frontend & React

**Purpose:** Go deep on frontend engineering by building one product three times — each time refactoring the same application into a more capable stack. Students learn that real engineering includes migration, not just greenfield builds.

**Prerequisite:** None. Standalone track — no Track 1 required.

**Backend:** Out of scope. This track is frontend-only. How data is stored or fetched is the student's choice and not graded. The product logic and UI evolution are what matter.

---

## Pedagogical Model — Refactor, Don't Restart

Track 2 is defined by **stack evolution on one product**:

```
Phase A: HTML / CSS / JavaScript  →  vanilla web app
Phase B: React refactor           →  same product, component architecture
Phase C: React Native refactor    →  same product, mobile experience
```

The domain stays constant across all three phases (e.g. a fitness tracker, event planner, or recipe app). Students experience what teams actually do: carry product logic forward while replacing the presentation layer and platform.

Refactor commits are first-class progress. A week of "only refactoring" is a successful week.

---

## Student Project Model

- **One repository** for the entire track
- **One product domain** chosen at the start (student picks; mentor approves scope)
- **Frontend only** — no backend requirements
- **Three frontend generations** in the same repo (tagged or branched by phase — e.g. `phase-a/vanilla`, `phase-b/react`, `phase-c/native`)

### Data & persistence (student's choice — not taught, not required)

Pick whatever keeps the focus on UI. Examples:

- `localStorage` / `IndexedDB`
- Static JSON files bundled with the app
- A public API (JSONPlaceholder, etc.)
- Firebase / Supabase / mock server (if the student already knows one)
- Hardcoded seed data that grows over time

Mentors review **frontend work**: layout, interaction, component structure, migration quality. Not database design or API architecture.

Domain examples: habit tracker, local events board, recipe collection, workout log, reading list.

---

## Stage 0 — Onboarding

Same as Track 1: GitHub account, repository setup, local dev environment, first commit. Track 2 students get Git discipline here — not from a prior track.

---

## Phase A — Vanilla Web (HTML / CSS / JavaScript)

**Goal:** Build a complete, usable web frontend without frameworks. Understand the platform before abstracting it.

### Topics

- Semantic HTML and accessibility basics
- CSS layout (flexbox, grid), responsive design
- Vanilla JavaScript: DOM, events, fetch, async
- Client-side state without a framework
- Form handling and validation (client-side)
- Fetching and displaying data (public API, local JSON, or client-side storage)
- Basic performance and UX patterns

### Sandbox examples

- Build a responsive card layout
- Fetch and render a list from a public API
- Implement client-side form validation
- Create a reusable modal without a library

### Project milestones

- Static pages with real content structure
- Interactive UI driven by user input
- Full CRUD UI (create, read, update, delete) — data layer is student's choice
- Deployed static/frontend host (e.g. Netlify, Vercel)

**Phase outcome:** A working web application in plain HTML/CSS/JS. Student understands what React will later abstract.

---

## Phase B — React Refactor

**Goal:** Migrate the same product to React without changing the product's purpose. Learn component thinking by confronting real migration tradeoffs.

### Topics

- Why React: components, declarative UI, ecosystem
- Migration strategy: strangler pattern, incremental adoption
- JSX, components, props, composition
- State: `useState`, `useEffect`, lifting state
- Forms and controlled components
- React Router (or equivalent)
- Data fetching patterns in React
- Project structure and file organization
- Testing React components

### Sandbox examples

- Convert one vanilla page section into a React component
- Build a reusable form component with validation
- Implement a custom hook for API fetching
- Write tests for a presentational component

### Project milestones

- React app scaffolded alongside or replacing vanilla code
- Core screens migrated (list, detail, create/edit)
- Feature parity with Phase A — same product behavior
- Improved structure: component library, shared hooks, clear folders
- Deployed React build

**Phase outcome:** The same product, now in React. Git history shows the migration. Student can explain what changed and why.

---

## Phase C — React Native Refactor

**Goal:** Adapt the same product for mobile. Learn platform differences, navigation, and what transfers from React web vs what doesn't.

### Topics

- React Native vs React DOM: what's shared, what's different
- Expo (or bare workflow) setup and tooling
- Mobile navigation (stack, tabs)
- Native UI primitives (`View`, `Text`, `ScrollView`, etc.)
- Platform-specific styling and safe areas
- Mobile forms, keyboards, and touch patterns
- Data loading on mobile (same data approach as web phases)
- Debugging on device/simulator
- Build and distribution basics (TestFlight / internal APK)

### Sandbox examples

- Build a single screen matching an existing React web page
- Implement tab navigation between two views
- Handle loading and error states on slow mobile networks
- Adapt a web layout to mobile constraints

### Project milestones

- React Native app with core navigation in place
- Primary user flows ported (view, create, edit — matching Phase B behavior)
- Mobile-appropriate UX (not a pixel-copy of the website)
- Runs on simulator/device; optional store-ready build

**Phase outcome:** The same product concept on mobile. Student has shipped one idea across three frontend stacks.

---

## Track 2 — Workflow Progression

Same as platform-wide workflow rules, applied within the track:

1. Direct commits (Phase A early)
2. Feature branches (Phase A late / Phase B)
3. Pull requests (Phase B migration work)
4. PR reviews (Phase C)

Migration phases are ideal for PR-based review: "Does this PR preserve behavior while moving to React?"

---

## Track 2 — Success Criteria

A student succeeds when they can:

- Build a production-quality UI in vanilla HTML/CSS/JS
- Plan and execute a framework migration without losing product behavior
- Structure a React application with components, state, and routing
- Port a React web app to React Native with appropriate mobile UX
- Use Git to document refactors across stack changes

**Graduation outcome:** One repository showing vanilla → React → React Native evolution. Deployed web app + runnable mobile build. Git history that tells a migration story.

---

# Future Tracks (Planned)

Tracks are added as the platform matures. Candidates:

| Track | Focus | Notes |
|-------|-------|-------|
| **Backend & APIs** | Node, databases, auth, system design | Standalone server-side track |
| **DevOps & Infrastructure** | CI/CD, containers, cloud, observability | Assumes deployed app experience |
| **Testing & Quality** | TDD, E2E, performance, reliability | Cross-cutting; pairs with any track |
| **AI-Assisted Development** | LLM tooling, agents, production AI features | Standalone or after any other track |

Each future track follows the same rules: one evolving project per track, Lesson → Sandbox → Project, no mid-track resets.

---

## Cross-Track Rules

1. **Within a track:** one repo, one product, no resets. Refactors and migrations count.
2. **Between tracks:** new repo per track. Tracks do not share prerequisites — enroll in any track directly.
3. **No prescribed order.** Track 1 and Track 2 are parallel paths, not a sequence.
4. **CommitLoop loop** applies uniformly — only the content and stack change per track.
