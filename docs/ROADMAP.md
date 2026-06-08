# CommitLoop — Roadmap

Living doc. I (the build agent) own execution; you guide and unblock.

**Branch:** `project/commitloop`  
**Last updated:** 2026-06-08

---

## North star

Prove the wedge: **people will show up daily when GitHub is watched and curriculum tells them what to do next.**

---

## Done

- [x] Product docs (curriculum, platform, positioning)
- [x] `commitloop/` app scaffold
- [x] Landing page
- [x] GitHub OAuth + repo linking
- [x] Streak dashboard (current / longest / 14-day heatmap)
- [x] Track 1 curriculum content (Stage 0–1)

---

## In progress

- [ ] npm install + verify local run
- [ ] GitHub OAuth app credentials ( **needs you** — 5 min at github.com/settings/developers)

---

## Next up (agent-owned)

| Priority | Task | Why |
|----------|------|-----|
| P0 | Deploy landing to `commitloop.dev` | Park the name, look real |
| P1 | Stage 2–4 curriculum content | Enough to run a real student for a month |
| P1 | Assignment checklists in dashboard | "What do I do today?" without Notion |
| P2 | Mentor view (inactive students list) | Accountability for cohort 1 |
| P3 | Track picker on signup | Track 1 vs Track 2 |
| P3 | Discord link + cohort entity | When first students appear |

---

## Blocked on you

| Item | Effort | Notes |
|------|--------|-------|
| GitHub OAuth app | 5 min | Callback: `http://localhost:3001/auth/github/callback` (prod URL later) |
| Domain DNS | 10 min | Point `commitloop.dev` at hosting when we deploy |
| Waitlist URL | 2 min | Formspree/Buttondown → set `VITE_WAITLIST_URL` |
| First beta student | optional | You, a friend, or wait — no rush |

---

## Not now

- Payments / Stripe
- AI mentor
- Leaderboards
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
