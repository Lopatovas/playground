# CommitLoop

**One loop. One project. Every day.**

Accountability-first engineering apprenticeship. GitHub is the source of truth.

- [Product docs](../docs/positioning.md)
- [Curriculum](../docs/curriculum.md)
- [Platform spec](../docs/platform.md)
- [Roadmap](../docs/ROADMAP.md)

## What's built

| Piece | Status |
|-------|--------|
| Landing page | ✅ |
| GitHub OAuth + connect repo | ✅ |
| Streak dashboard | ✅ |
| Track 1 curriculum (Stage 0–1) | ✅ |
| Assignments / mentor view | 🔜 |

## Quick start

```bash
# 1. Copy env and add GitHub OAuth app credentials
cp .env.example .env
# Create OAuth app: https://github.com/settings/developers
# Callback URL: http://localhost:3001/auth/github/callback

# 2. API
cd api && npm install && npx prisma migrate dev && npm run dev

# 3. Web (separate terminal)
cd web && npm install && npm run dev
```

- Web: http://localhost:5173
- API: http://localhost:3001

## Spin out to new repo

This folder + `docs/` (curriculum, platform, positioning) is the seed. When ready:

```bash
git clone -b project/commitloop <playground-url> commitloop
# Or copy commitloop/ and docs/ into a fresh repo
```
