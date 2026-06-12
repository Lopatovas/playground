Deploy your full-stack app to production. Same codebase — new environment.

## 1. Prepare for production

```bash
git switch -c feature/deployment
```

- Add `.env.example` with all required keys (no real secrets)
- Confirm `.env` is in `.gitignore`
- Add `GET /health` to the API if missing
- Run `npm run build` for **api** and **web** locally — fix failures

Commit: `chore: prepare env example and health endpoint`.

## 2. Deploy the API

Pick a host (Railway, Render, Fly.io, etc.):

- Connect repo, set root to `api/`
- Configure `DATABASE_URL` (use hosted Postgres if SQLite won't persist)
- Set `WEB_URL` to your planned frontend URL (update after web deploy if needed)
- Set `SESSION_SECRET` to a long random string
- Deploy and copy the **HTTPS API URL**

Smoke test: `curl https://YOUR-API/health`

Commit any deploy config files: `chore: add API deploy config`.

## 3. Deploy the frontend

Deploy `web/` to Vercel (or similar):

- Set `NEXT_PUBLIC_API_URL` to your production API URL
- Deploy and copy the **HTTPS web URL**

Update API `WEB_URL` / CORS to allow the real frontend origin. Redeploy API if needed.

## 4. End-to-end smoke test

On the **live site** (not localhost):

1. Open the production URL
2. Create a record through the UI
3. Refresh — it should still be there
4. Check Network tab — requests hit production API

## 5. Document and merge

Add live URLs to README. Open PR, merge.

```bash
git push -u origin feature/deployment
```

## Outcome

You have a resume-ready link. The same app you built in Stages 2–3 now runs on the internet. Next stage: tests so deploys don't break silently.
