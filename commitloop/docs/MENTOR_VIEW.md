# CommitLoop — Mentor view

**Status:** v1 implemented  
**Last updated:** 2026-06-10

Ops dashboard for mentors: see student progress and GitHub activity at a glance.

---

## Ship bar (product)

CommitLoop ships when all three pillars are ready:

| Pillar | Owner | Status |
|--------|-------|--------|
| **Curriculum** | Content agent / you | Mechanism ✅ — Stages 0–1 live; Stage 2+ authored separately |
| **Accountability gate** | Platform | Not started — warnings, reminders, lockout (after mentor view) |
| **Mentor ops** | Platform | **v1 shipped** — accountability gate next |

Curriculum authoring stays in git (`content/track-1/`); no in-app CMS.

---

## Mentor view v1 (this milestone)

### Job

Answer: **who needs attention today?**

### In scope

- Protected `/mentor` route (mentors only)
- Student roster: username, stage, step, quiz passed, repo link
- GitHub activity: active today, missed today, current streak, last commit date
- Visual highlight for **missed today** and **no repo linked**
- Sort: needs attention first

### Out of scope (v1)

- Editing curriculum or student progress
- In-app messaging (Discord stays primary)
- PR review UI
- Email / push reminders
- Auto lockout (accountability gate — next milestone)
- Per-student drill-down page (table + repo link is enough)

---

## Access control

Mentors are identified by **GitHub user id allowlist** in env:

```bash
# commitloop/.env
MENTOR_GITHUB_IDS=12345678,87654321
```

- `GET /me` returns `isMentor: true` when the logged-in user's `githubId` is listed
- `GET /mentor/students` returns **403** for non-mentors
- Mentor nav link only shown when `isMentor`

No `role` column in v1 — add later if mentor management needs UI.

---

## API

| Endpoint | Auth | Purpose |
|----------|------|---------|
| `GET /mentor/students` | Mentor | All students with progress + streak snapshot |

Response shape (per student):

```json
{
  "students": [
    {
      "id": "…",
      "username": "dev",
      "avatarUrl": "…",
      "trackId": "track-1",
      "currentStage": "stage-1-git-fundamentals",
      "stageTitle": "Stage 1 — Git Fundamentals",
      "currentStep": "sandbox",
      "quizPassed": false,
      "repo": { "owner": "dev", "name": "my-app" },
      "repoUrl": "https://github.com/dev/my-app",
      "streak": {
        "configured": true,
        "activeToday": false,
        "missedToday": true,
        "currentStreak": 4,
        "lastActivityDate": "2026-06-09"
      },
      "attention": "missed_today"
    }
  ]
}
```

`attention` values: `ok` | `missed_today` | `no_repo` | `inactive`

Streak is computed with the same logic as `GET /streak`, using each student's linked repo and access token.

---

## Web

- Route: `app/(app)/mentor/page.tsx`
- Feature: `web/features/mentor/mentor-student-table.tsx`
- Nav: **Mentor** link in `AppHeader` when `user.isMentor`

Wireframe reference: [WIREFRAMES.md](./WIREFRAMES.md) Screen 6.

---

## Implementation checklist

- [x] Document plan (this file)
- [x] `MENTOR_GITHUB_IDS` in config + `.env.example`
- [x] `api/src/features/mentor/` — service, routes
- [x] Extend `GET /me` with `isMentor`
- [x] Register `mentor` in `architecture/src/paths.ts`
- [x] Web page + table component
- [x] Tests: service unit, integration (403 + 200), component

---

## Next after mentor v1

### Accountability gate (P2)

Behavior enforcement layer — separate from comprehension quiz:

1. **Flag** — missed today → mentor row highlight (v1 mentor view)
2. **Warn** — in-app banner after N missed weekdays
3. **Remind** — email or Discord webhook
4. **Soft lock** — read-only mode until student submits a plan
5. **Hard lock** — mentor unlock required

Policy TBD (hybrid: system warns + soft-lock; mentor unlocks).

### Production

- Postgres migration
- Deploy API + web to commitloop.dev
- GitHub OAuth prod callback URL

---

## Related docs

- [ROADMAP.md](./ROADMAP.md) — priorities
- [ARCHITECTURE.md](./ARCHITECTURE.md) — API + web structure
- [platform.md](./platform.md) — mentor system requirements
- [WIREFRAMES.md](./WIREFRAMES.md) — Screen 6
