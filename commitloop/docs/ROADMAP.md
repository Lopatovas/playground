# CommitLoop — Roadmap

Living doc. I (the build agent) own execution; you guide and unblock.

**Branch:** `project/commitloop`  
**Last updated:** 2026-06-10

---

## North star

Prove the wedge: **people will show up daily when GitHub is watched and curriculum tells them what to do next.**

---

## Ship bar

We ship when all three pillars are ready:

1. **Curriculum** — meaningful theory → sandbox → quiz → project per stage (content agent; mechanism in place)
2. **Accountability gate** — warnings, reminders, eventual lockout for inactive students
3. **Mentor ops** — roster + activity visibility for mentors

Details: [MENTOR_VIEW.md](./MENTOR_VIEW.md) (mentor v1 + accountability roadmap).

---

## Done

- [x] Product docs (curriculum, platform, positioning)
- [x] `commitloop/` app scaffold
- [x] Landing page + mobile-friendly shell + CL logo
- [x] GitHub OAuth + repo linking
- [x] Streak dashboard (current / longest / 7-day heatmap)
- [x] Hybrid curriculum content system (`track.json` + stage folders, `content:check`)
- [x] Comprehension quiz gates Project step (server-side grading)
- [x] Track 1 curriculum content (Stage 0–1)
- [x] Architecture locked → [ARCHITECTURE.md](./ARCHITECTURE.md)
- [x] Wireframes approved + implemented → [WIREFRAMES.md](./WIREFRAMES.md)
- [x] Next.js 16 web + assignment-first home
- [x] Assignment API (step, quiz, checklist, advance)
- [x] Auth shell (`AuthProvider` + `(app)` route group)
- [x] Feature-based API + web architecture
- [x] Tests (103+), coverage, ESLint, CI pipeline
- [x] Mentor view v1 — [MENTOR_VIEW.md](./MENTOR_VIEW.md)

---

## In progress

- [ ] GitHub OAuth credentials ( **needs you** — 5 min)
- [ ] Stage 2+ curriculum content ( **content agent / you** )

---

## Next up

| Priority | Task |
|----------|------|
| P1 | Stage 2–4 curriculum (flip `available` in `track.json` when ready) |
| P1 | Accountability gate (warn → remind → soft/hard lock) |
| P2 | Deploy to commitloop.dev + Postgres |
| P3 | Payments / founding cohort |

---

## Blocked on you

| Item | Effort | Notes |
|------|--------|-------|
| GitHub OAuth app | 5 min | Callback: `http://localhost:3001/auth/github/callback` (prod URL later) |
| `MENTOR_GITHUB_IDS` | 1 min | Your GitHub numeric user id in `.env` |
| Domain DNS | 10 min | Point `commitloop.dev` at hosting when we deploy |
| Waitlist URL | 2 min | Formspree/Buttondown → set `NEXT_PUBLIC_WAITLIST_URL` |
| Curriculum stages 2+ | ongoing | Hybrid format in `content/track-1/` |

---

## Not now

- Payments / Stripe
- AI mentor
- Leaderboards
- In-app curriculum CMS
- Full Track 2 curriculum
- Mobile app

---

## Kill / continue criteria

**Continue building** if by end of month:

- App runs locally with your GitHub connected
- You've used it for 7 days on a real repo OR one other person tries it

**Pause** if nobody cares after landing + waitlist sit for 60 days with zero signups.

---

## How to run locally

See [commitloop/README.md](../commitloop/README.md).
