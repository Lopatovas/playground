# CommitLoop — Wireframes (v0)

**Status:** Draft for iteration — not final UI.

Design intent: **calm, tool-like, human.** A student opens this to know what to do today and whether they showed up. Not a bootcamp ad. Not an AI product.

Open the interactive version: **CommitLoop Wireframes** canvas in the IDE (beside chat).

---

## Design tokens (direction)

| Token | Direction |
|-------|-----------|
| Background | `#F7F6F3` warm paper |
| Surface | `#FFFFFF` with 1px `#E5E3DE` border |
| Text | `#1A1A18` primary, `#6B6960` secondary |
| Accent | `#2D6A4F` forest green — streak, primary actions only |
| Warning | `#B45309` missed day |
| Font | System UI or Source Sans 3 — **not** Inter + purple |
| Radius | 6–8px max — no pill-everything |

---

## Screen 1 — Landing (logged out)

**Job:** Explain wedge in 10 seconds. One CTA.

```
┌──────────────────────────────────────────────────────────────┐
│  CommitLoop                                    [Sign in]     │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Accountability-first apprenticeship                         │
│                                                              │
│  Build one real app.                                         │
│  Show up every day.                                          │
│                                                              │
│  [ Connect GitHub ]    How it works →                        │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐            │
│  │ The loop    │ │ One project │ │ GitHub is   │            │
│  │ Lesson →    │ │ No resets   │ │ the record  │            │
│  │ Sandbox →   │ │             │ │             │            │
│  │ Project     │ │             │ │             │            │
│  └─────────────┘ └─────────────┘ └─────────────┘            │
└──────────────────────────────────────────────────────────────┘
```

**Notes:**
- No full-width gradient hero
- No fake testimonial carousel
- "How it works" scrolls to 3 plain sentences, not a video

---

## Screen 2 — Student home (logged in) ★ PRIMARY

**Job:** Answer two questions — *what's my focus?* and *am I committed today?*

Layout: **assignment card dominates left (2/3), streak panel right (1/3).**

```
┌──────────────────────────────────────────────────────────────┐
│  CommitLoop          Track 1 · Stage 1        @user  [⚙]   │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────────────────┐ ┌────────────────┐ │
│  │ TODAY'S ASSIGNMENT                 │ │ COMMITMENT     │ │
│  │                                    │ │                │ │
│  │ Stage 1 — Git Fundamentals         │ │ Today    ✓     │ │
│  │ Step: Project Implementation       │ │ Streak   12    │ │
│  │                                    │ │ Longest  18    │ │
│  │ Push 3 meaningful commits across   │ │                │ │
│  │ 2 days. Add .gitignore and starter │ │ ▓▓▓▓▓░ last 7d │ │
│  │ code so the app runs locally.      │ │                │ │
│  │                                    │ │ user/repo →    │ │
│  │ [ Continue assignment ]            │ │                │ │
│  └────────────────────────────────────┘ └────────────────┘ │
│                                                              │
│  Up next: Sandbox — practice git in a scratch folder         │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**Open questions for you:**
- [ ] Show all 3 loop steps (Lesson / Sandbox / Project) as tabs on the card?
- [ ] "Continue" goes to full assignment page or expands inline?
- [ ] Streak heatmap: 7 days or 14?

---

## Screen 3 — Assignment detail

**Job:** Single stage, single loop step, checklist.

```
┌──────────────────────────────────────────────────────────────┐
│  ← Home    Stage 1 — Git Fundamentals                        │
├──────────────────────────────────────────────────────────────┤
│  [ Lesson ]  [ Sandbox ]  [ Project ]     ← active tab       │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Project Implementation                                      │
│                                                              │
│  In your project repository:                                 │
│                                                              │
│  ☐ Add project structure (frontend / backend folders)      │
│  ☐ Add .gitignore                                            │
│  ☐ Minimal runnable starter code                             │
│  ☐ 3+ meaningful commits pushed                              │
│  ☐ Activity on a second day                                  │
│                                                              │
│  ── Lesson (collapsed) ─────────────────────── [ expand ]   │
│                                                              │
│  [ Mark step complete ]          Open repo on GitHub →       │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**Notes:**
- Lesson content collapsed by default on Project tab — execution first
- Checkboxes are self-report for v0; GitHub verifies commits separately

---

## Screen 4 — Curriculum map

**Job:** See the full Track 1 path. Where am I?

```
┌──────────────────────────────────────────────────────────────┐
│  ← Home    Track 1 — Fundamentals                            │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ● Stage 0 — Onboarding                          complete    │
│  ● Stage 1 — Git Fundamentals                    current     │
│  ○ Stage 2 — First End-to-End System             locked      │
│  ○ Stage 3 — System Structure                    locked      │
│  ○ Stage 4 — Deployment                          locked      │
│  ○ Stage 5 — Testing                             locked      │
│  ○ Stage 6 — Expansion Loop                      locked      │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

Linear list, not a gamified skill tree.

---

## Screen 5 — Settings

**Job:** Repo link, track display (read-only for v0), Discord link.

```
┌──────────────────────────────────────────────────────────────┐
│  ← Home    Settings                                          │
├──────────────────────────────────────────────────────────────┤
│  GitHub        @username                    [ Disconnect ]   │
│  Project repo  user / my-app                [ Change ]       │
│  Track         Track 1 — Fundamentals                        │
│  Community     Discord invite →                              │
└──────────────────────────────────────────────────────────────┘
```

---

## Screen 6 — Mentor view (later)

Dashed — not v0. List of students, red row = missed today, link to repo.

---

## Iteration checklist

Reply with preferences or sketch changes:

1. **Home layout** — assignment left / streak right OK?
2. **Assignment tabs** — Lesson | Sandbox | Project on one page?
3. **Light vs dark** — default light?
4. **Nav** — top bar only, or left sidebar for app?
5. **Anything that feels too "startup" or too "bootcamp"?**

When wireframes lock → implement in Next.js per [ARCHITECTURE.md](./ARCHITECTURE.md).
