# Scryglass

Local review cockpit. It does not judge. It reveals.

```text
Foundry (Express) → engine (flags / layers) → High Seat (Vite)
        ↑
   fixture host + Bitbucket (Cloud or Data Center)
```

Job 2 is computed. Jev is not called.

## Run

```bash
cd scryglass
npm install
npm run check
npm run dev
```

High Seat: http://127.0.0.1:8787

```bash
npm run cli -- open PR-01
npm run cli -- check
```

Sessions write to `SCRYGLASS_HOME` or `~/.scryglass/`. Fixture publishes land in `published/<prId>.json` with `target: "pullrequest"`.

## Open a real Bitbucket PR

Cloud (app password or repository/workspace access token):

```bash
export BITBUCKET_USERNAME=your-user
export BITBUCKET_APP_PASSWORD=your-app-password
# or
export BITBUCKET_TOKEN=your-workspace-or-repo-token
```

Data Center / Server:

```bash
export BITBUCKET_URL=https://bitbucket.your-company.com
export BITBUCKET_USERNAME=your-user
export BITBUCKET_APP_PASSWORD=your-http-access-token
# or BITBUCKET_TOKEN=...
```

Then `npm run dev` and paste the PR URL in the High Seat, or:

```bash
npm run cli -- open https://bitbucket.org/workspace/repo/pull-requests/12
```

Scryglass clones into `~/.scryglass/workdirs/…`, ranks the changed files, and **Publish to PR** posts to the pull request comment API (never a commit comment).

Token scopes: repository read + `pullrequest` / `pullrequest:write`.

## Behind a VPN

Scryglass is local. It talks to Bitbucket from **this machine**. There is no cloud jump, so a Cloud Agent or any other box that is not on the VPN cannot see your host.

1. Connect to the VPN first.
2. Run `npm run dev` on that same laptop.
3. If DNS or TCP fails, High Seat and `GET /api/health` say so: _Can't resolve / Can't reach `<host>`. Connect to the VPN._
4. Corporate CA: `export BITBUCKET_CA_BUNDLE=/path/to/corp-ca.pem` (or `NODE_EXTRA_CA_CERTS`). Last resort: `BITBUCKET_TLS_INSECURE=1`.
5. Git checkout honors `HTTPS_PROXY` / `HTTP_PROXY`.

Optional file: `~/.scryglass/config.json`

```json
{
  "bitbucket": {
    "username": "you",
    "appPassword": "…",
    "token": "",
    "url": "https://bitbucket.your-company.com",
    "caBundle": "/path/to/corp-ca.pem"
  }
}
```

## Quality gates

`npm run check` is format + lint + typecheck + tests.

Tests are the contract:

- engine goldens vs `fixtures/expected`
- shared API ranks above a one-page heading
- `FetchingHeading` stays `component` + `ui.network`
- drafts persist; publish is PR-only
- Bitbucket comments post to `/pullrequests/{id}/comments`, never a commit URL
- A Bitbucket URL without credentials fails closed
- Unreachable / VPN-blocked Bitbucket fails as HTTP 503 with a connect-VPN hint
- Corporate CA is passed to Node and git (`BITBUCKET_CA_BUNDLE`)
