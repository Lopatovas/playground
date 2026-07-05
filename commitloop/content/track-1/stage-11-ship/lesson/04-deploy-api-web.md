## Localhost is a lie (a useful one)

Your app works on `localhost`. Ports are right, CORS is loose, errors show in the terminal. It feels done.

Production is different:

- Environment variables aren't set unless you configure them
- Build steps fail on code that dev mode ignored
- HTTPS, cold starts, and CORS bite you
- The database file on your laptop doesn't exist on the server

**Deploy** — but only after tests pass locally.

## What "deployed" means

1. A **public HTTPS URL** anyone can hit
2. **Config** injected by the host, not hardcoded in git
3. Two deployables:

| Piece | Typical host | Example URL |
| --- | --- | --- |
| **API** | Railway, Render, Fly.io | `https://your-api.up.railway.app` |
| **Frontend** | Vercel, Netlify, Cloudflare Pages | `https://your-app.vercel.app` |

## Environment variables and secrets

| File | Commit? | Purpose |
| --- | --- | --- |
| `.env` | **No** | Real local secrets |
| `.env.example` | **Yes** | Documents required keys |
| Host secrets UI | N/A | Production values |

```text
# .env.example
DATABASE_URL=file:./dev.db
JWT_SECRET=change-me-in-production
WEB_URL=http://localhost:3000
API_URL=http://localhost:3001
```

**Code in git. Config in the environment. Secrets never in git.**

## Deploy checklist (API)

1. Connect GitHub repo, root `api/`
2. Start command: `npm start`
3. Env: `DATABASE_URL`, `JWT_SECRET`, `WEB_URL`
4. **Persistent database** — ephemeral SQLite resets on redeploy
5. CORS allows production `WEB_URL`

```javascript
app.use(cors({
  origin: process.env.WEB_URL,
  credentials: true,
}));
```

## Deploy checklist (web)

1. Root `web/`
2. Set `API_URL` (or equivalent) to **production API URL**
3. Deploy — copy HTTPS web URL
4. Update API `WEB_URL` if needed, redeploy API

## Common failures

| Symptom | Likely fix |
| --- | --- |
| CORS error | Add frontend URL to API CORS |
| API calls localhost | Rebuild web with correct `API_URL` |
| 500 on login | Missing `JWT_SECRET` or `DATABASE_URL` on host |
| Data gone after redeploy | Ephemeral DB — use hosted Postgres |

## Document live URLs

Add to README — recruiters click these:

```markdown
## Live demo
- Web: https://my-app.vercel.app
- API: https://my-api.up.railway.app
```

That's Track 1 graduation artifact alongside green CI.
