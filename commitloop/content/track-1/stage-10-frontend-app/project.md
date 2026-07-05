Wire the **frontend application** to your auth API — vanilla JavaScript only, no React.

## 1. App shell and navigation

```bash
git switch -c feature/frontend-app
```

In `web/`:

- One `index.html` with sections: `#view-login`, `#view-register`, `#view-app`
- Inside `#view-app`: nav links (List, Add, Settings) and content areas
- `showView(name)` — hide all views, show one (or use `#/list` hash routing)

Commit: `feat: app shell with client navigation`.

## 2. Login and register screens

- Register form → `POST /auth/register` → store `accessToken` + `refreshToken`
- Login form → `POST /auth/login` → same
- On success → `showView('app')` and call `loadCurrentUser()` via `GET /me`
- Show validation errors from API (`400`, `401`)

Helper:

```javascript
async function apiFetch(path, options = {}) {
  const token = getAccessToken();
  const headers = { "Content-Type": "application/json", ...options.headers };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  if (res.status === 401) { clearTokens(); showView("login"); throw new Error("Unauthorized"); }
  return res;
}
```

Commit: `feat: login and register screens`.

## 3. Auth gate

On page load:

1. If no token → show login
2. If token → `GET /me` → success: show app + set `currentUser`; fail: clear tokens, show login

Protected nav clicks check auth before switching views.

Commit: `feat: auth gate on app boot`.

## 4. Role-aware UI

After `/me` returns `{ role }`:

- If `role === 'admin'` → show admin panel link / delete-all button
- Else → omit those elements from the DOM (don't just `display:none` secrets — don't render)

Verify: log in as `user`, admin controls absent. Log in as admin, they appear. API still returns 403 if forced via curl.

Commit: `feat: role-aware UI from /me`.

## 5. Search UI

- Search input + button (or debounced input)
- On search: `GET /your-resource?q=term&page=1&limit=20`
- Re-render list from response; show empty state when no matches
- Combine with pagination controls from Stage 7 if present

Commit: `feat: search UI wired to API`.

## 6. Logout and merge

- Logout: clear tokens, optional `POST /auth/logout` if implemented, show login
- Manual test: register → create item → search → logout → can't access app
- Push PR and merge

## Outcome

A usable client on top of your API. Stage 11 adds tests, CI, and production deploy for the full stack.
