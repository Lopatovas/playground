# Expose the POC via Cloudflare Tunnel

## Throwaway link (quick tunnel) — start here

For a **temporary `*.trycloudflare.com` URL** with no Cloudflare account setup, DNS, or tokens:

```bash
npm run tunnel:quick
# or
docker compose -f docker-compose.yml -f docker-compose.quicktunnel.yml up -d --build
docker compose -f docker-compose.yml -f docker-compose.quicktunnel.yml logs -f cloudflared
```

Look for a line like:

```text
https://random-words-here.trycloudflare.com
```

That single link serves **both** the UI and API (nginx proxies `/health`, `/scans`, `/docs`, `/queues` to the API container). No secrets are embedded in the frontend — only an empty API base URL so calls stay same-origin.

| Property | Quick tunnel |
| --- | --- |
| Setup | None (no token) |
| URL lifetime | Ephemeral; changes when you restart `cloudflared` |
| Good for | Demos, sharing with a colleague for an hour |
| Bad for | Production, real customer data |

Use **fake sample CSVs only**. Anyone with the link can use the app (no login).

Stop:

```bash
docker compose -f docker-compose.yml -f docker-compose.quicktunnel.yml down
```

---

## Named domain (Zero Trust tunnel)

[Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/) (`cloudflared`) can also publish on **your own domain** with a tunnel token.

This path needs **two public hostnames** (or subdomains):

| Service | Docker target | Example public URL |
| --- | --- | --- |
| Web UI | `http://web:80` | `https://app.yourdomain.com` |
| API | `http://api:3000` | `https://api.yourdomain.com` |

The web image is built with `VITE_API_BASE_URL` pointing at the public API URL. The API allows CORS from `WEB_ORIGIN` (your public web URL).

## Prerequisites

- A domain on Cloudflare (DNS proxied through Cloudflare).
- [Cloudflare Zero Trust](https://one.dash.cloudflare.com/) (free tier is enough for tunnels).
- Docker Compose running the app locally or on a server.

## Option A — Tunnel token (recommended)

### 1. Create the tunnel in Zero Trust

1. Open **Networks → Tunnels → Create a tunnel**.
2. Choose **Cloudflared** → name it e.g. `ai-readiness-scanner`.
3. Copy the **tunnel token** (install command contains it).

### 2. Add public hostnames (ingress)

In the tunnel’s **Public Hostname** tab, add two routes:

| Public hostname | Service type | URL |
| --- | --- | --- |
| `app.yourdomain.com` | HTTP | `http://web:80` |
| `api.yourdomain.com` | HTTP | `http://api:3000` |

Use the Docker **service names** (`web`, `api`), not `localhost`.

### 3. Configure `.env`

```bash
cp .env.sample .env
```

Set:

```env
CLOUDFLARE_TUNNEL_TOKEN=paste-token-here
PUBLIC_WEB_URL=https://app.yourdomain.com
PUBLIC_API_URL=https://api.yourdomain.com
WEB_ORIGIN=https://app.yourdomain.com
VITE_API_BASE_URL=https://api.yourdomain.com
```

Keep your existing `MISTRAL_API_KEY` and database settings.

### 4. Start with the Cloudflare overlay

```bash
docker compose -f docker-compose.yml -f docker-compose.cloudflare.yml up -d --build
```

The `web` service is rebuilt so the browser calls the public API URL. `cloudflared` joins the Compose network and connects outbound to Cloudflare.

### 5. Verify

- `https://app.yourdomain.com` — upload UI
- `https://api.yourdomain.com/health` — `{"status":"ok"}`

## Option B — Config file + credentials

For ingress defined in YAML (see `cloudflare/config.yml.example`):

```bash
cloudflared tunnel create ai-readiness-scanner
cloudflared tunnel route dns ai-readiness-scanner app.yourdomain.com
cloudflared tunnel route dns ai-readiness-scanner api.yourdomain.com
# credentials land in ~/.cloudflared/<uuid>.json — copy to cloudflare/credentials.json
cp cloudflare/config.yml.example cloudflare/config.yml
# edit tunnel UUID + hostnames in config.yml
```

```bash
docker compose -f docker-compose.yml -f docker-compose.cloudflare.config.yml up -d --build
```

## Security notes (POC)

- Anyone with the URL can use the app (no login). Restrict access with [Cloudflare Access](https://developers.cloudflare.com/cloudflare-one/policies/access/) (email OTP, SSO) on one or both hostnames.
- Do not expose Postgres (`5432`) or Redis (`6379`) through the tunnel — only `web` and `api`.
- Swagger (`/docs`) and Bull Board (`/queues`) are public if the API hostname is public; disable or protect them before a wider demo.

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| UI loads, API calls fail (CORS) | `WEB_ORIGIN` must exactly match `PUBLIC_WEB_URL` (scheme + host, no trailing slash). Rebuild: `docker compose ... up -d --build`. |
| UI calls `localhost:3000` | Rebuild `web` after setting `PUBLIC_API_URL` / `VITE_API_BASE_URL`. |
| Tunnel container exits | Check `CLOUDFLARE_TUNNEL_TOKEN` and that ingress targets `http://web:80` / `http://api:3000`. |
| 502 from Cloudflare | Ensure `web` and `api` containers are healthy before `cloudflared` starts. |

## Local-only compose unchanged

```bash
docker compose up --build
```

still works without Cloudflare. The overlay files are optional.
