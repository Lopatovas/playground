## Three features, three merges

Stage 7 tempts you to build auth + categories + pagination in one weekend spaghetti commit. Resist.

Suggested sequence:

```text
1. feature/auth          → merge
2. feature/user-scoped-data → merge
3. feature/pagination    → merge
```

Each PR should:

- Pass tests
- Stay deployable
- Be reviewable in under 20 minutes

## Definition of done per feature

**Auth:** register, login, logout, `/me` endpoint, protected POST  
**Scoped data:** new rows tied to `user_id`; list filtered  
**Pagination:** `page` + `limit` on list endpoint; UI shows pages  
**Related entity:** at least one FK (e.g. categories)

You don't need file uploads or WebSockets for graduation. Depth on core expansion beats breadth of half-built features.

## Update tests as you go

Each feature branch adds tests:

- Auth: 401 without session
- Scoped: user A can't read user B's rows
- Pagination: page 2 ≠ page 1

## You made it

Finishing Stage 7 means you've completed **Track 1: Fundamentals**.

You have a deployed, tested, evolving full-stack application and the habits to keep building. Put the live URL in your README, screenshot the mentor view of your streak, and decide if Track 2 (frontend depth) or job applications comes next.

> The loop doesn't end — Lesson → Sandbox → Quiz → Project just becomes *your* loop for every new feature.
