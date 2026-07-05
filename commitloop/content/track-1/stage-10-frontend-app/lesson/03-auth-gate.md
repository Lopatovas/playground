## Gate before the app renders

An **auth gate** runs when the page loads (and on navigation to protected views). It answers: *is there a valid session?*

```javascript
async function boot() {
  const token = getAccessToken();
  if (!token) {
    showView("login");
    return;
  }
  try {
    const res = await apiFetch("/me");
    if (!res.ok) throw new Error("Unauthorized");
    currentUser = await res.json();
    showView("app");
    renderApp();
  } catch {
    clearTokens();
    showView("login");
  }
}

document.addEventListener("DOMContentLoaded", boot);
```

## When to redirect to login

| Situation | Client action |
| --- | --- |
| No token on boot | Show login |
| `/me` returns 401 | Clear tokens, show login |
| Access token expired mid-session | Try refresh; if fail → login |
| User clicks Logout | Clear tokens, show login |

## Refresh on 401 (optional but good)

```javascript
async function apiFetch(path, options) {
  let res = await fetchWithToken(path, options);
  if (res.status === 401 && getRefreshToken()) {
    const refreshed = await tryRefresh();
    if (refreshed) res = await fetchWithToken(path, options);
  }
  if (res.status === 401) {
    clearTokens();
    showView("login");
  }
  return res;
}
```

This mirrors the Postman refresh flow from Stage 9 — automated for the user.

## Don't flash protected content

Wrong order:

1. Show app shell
2. Discover user isn't logged in
3. Hide app

Right order:

1. Show loading or blank
2. Verify auth
3. Show login **or** app

A brief loading state beats leaking a frame of private UI.

## Protected routes in vanilla JS

If using hash routes, check auth on `hashchange`:

```javascript
window.addEventListener("hashchange", () => {
  if (!currentUser && location.hash !== "#/login") {
    location.hash = "#/login";
  }
});
```

Same rule: no token → no app views.
