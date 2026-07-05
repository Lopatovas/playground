## Config that changes per environment

Your API needs different values in development vs production:

- Database connection string
- Session secret
- Allowed frontend URL (for CORS)
- Third-party API keys

**Environment variables** let the same code read `process.env.DATABASE_URL` while the *value* changes per host.

```javascript
const port = process.env.PORT ?? 3001;
const webUrl = process.env.WEB_URL ?? "http://localhost:3000";
```

## Never commit secrets

| File | Commit? | Purpose |
| --- | --- | --- |
| `.env` | **No** (gitignored) | Real local secrets |
| `.env.example` | **Yes** | Documents required keys with placeholders |
| Host secrets UI | N/A | Production values |

```text
# .env.example
DATABASE_URL=file:./dev.db
SESSION_SECRET=change-me-in-production
WEB_URL=http://localhost:3000
```

If you ever commit a real API key: **rotate it immediately**. Git history keeps secrets forever.

## Frontend env vars

In Next.js, only variables prefixed with `NEXT_PUBLIC_` are exposed to the browser:

```text
NEXT_PUBLIC_API_URL=http://localhost:3001
```

Production: set `NEXT_PUBLIC_API_URL` to your deployed API URL in Vercel's environment settings, then redeploy.

## The rule

**Code in git. Config in the environment. Secrets never in git.**
