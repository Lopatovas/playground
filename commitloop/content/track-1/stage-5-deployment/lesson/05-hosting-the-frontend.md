## Frontend deploy is usually easier

Static sites and Next.js apps deploy cleanly to **Vercel**, **Netlify**, or **Cloudflare Pages**:

1. Connect GitHub repo
2. Set root to `web/`
3. Framework preset: Next.js (auto-detected)
4. Set `NEXT_PUBLIC_API_URL` to your **production API URL**
5. Deploy

Every push to `main` can auto-deploy. Preview URLs on PRs are a bonus.

## Verify the full loop

After both sides are live:

1. Open the **production frontend URL**
2. Create a record through the UI
3. Refresh — data should persist (API + DB in prod)
4. Open devtools Network tab — requests go to **production API**, not localhost

## Common failures

| Symptom | Likely fix |
| --- | --- |
| Network error / CORS | Add frontend URL to API `WEB_URL` / CORS |
| API calls still go to localhost | Rebuild frontend with correct `NEXT_PUBLIC_API_URL` |
| 500 on create | Check API logs; often missing `DATABASE_URL` |
| Empty after refresh | Ephemeral DB — use persistent storage |

## Document it

Add production URLs to your README:

```markdown
## Live demo
- Web: https://my-app.vercel.app
- API: https://my-api.up.railway.app
```

That's a portfolio line recruiters actually click.
