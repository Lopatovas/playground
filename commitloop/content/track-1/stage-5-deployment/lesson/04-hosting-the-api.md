## What the API host must do

Your API host needs to:

1. Run **Node** (or your runtime)
2. Expose an **HTTPS URL** on a port (often `PORT` env var)
3. Let you set **environment variables**
4. Stay running (not serverless-only unless your app supports it)

Popular starting points: **Railway**, **Render**, **Fly.io**. All have free tiers adequate for Track 1.

## Deploy checklist (API)

1. Connect your GitHub repo (or deploy from CLI)
2. Set root directory to `api/` if monorepo
3. Set start command: `npm start` or `node dist/index.js`
4. Add env vars: `DATABASE_URL`, `SESSION_SECRET`, `WEB_URL` (production frontend URL)
5. Use a **persistent database** — SQLite on ephemeral disks resets on redeploy; switch to Postgres or a hosted SQLite volume for prod

## Health endpoint

Add a simple route for smoke tests:

```javascript
app.get("/health", (_req, res) => {
  res.json({ ok: true });
});
```

After deploy: `curl https://your-api.example.com/health`

## CORS for production

Update CORS to allow your **production** frontend origin:

```javascript
app.use(cors({
  origin: process.env.WEB_URL,
  credentials: true,
}));
```

Forgetting this is the #1 "works locally, broken live" bug.
