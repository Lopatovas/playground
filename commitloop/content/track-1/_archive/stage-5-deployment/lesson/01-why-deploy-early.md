## Localhost is a lie (a useful one)

Your app works on `localhost`. Ports are right, CORS is loose, errors show in the terminal. It feels done.

Production is different:

- Environment variables aren't set unless you configure them
- Build steps fail on code that dev mode ignored
- HTTPS, cold starts, and CORS bite you
- The database file on your laptop doesn't exist on the server

**Deploy early** — even when the app is ugly — so you learn the delivery path while the codebase is still small.

## What "deployed" means

A deployed app has:

1. A **public URL** anyone can hit (usually HTTPS)
2. A **build process** that produces runnable artifacts
3. **Config** injected by the host, not hardcoded in git

You will deploy **two** things:

| Piece | Typical host | Example URL |
| --- | --- | --- |
| **API** | Railway, Render, Fly.io | `https://your-api.up.railway.app` |
| **Frontend** | Vercel, Netlify, Cloudflare Pages | `https://your-app.vercel.app` |

Exact hosts don't matter for the curriculum — pick one with a free tier and good Node support.

## The graduation milestone

Track 1 success includes **a live URL you can put on a resume**. Not "it works on my machine." A link.

> Shipping to production is a skill separate from writing features. Practicing it in Stage 5 — while the app is still simple — saves pain later.
