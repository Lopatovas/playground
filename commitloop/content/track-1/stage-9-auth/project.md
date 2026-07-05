Add **authentication and authorization to the API only** — no frontend changes yet. Prove the full flow in Postman before Stage 10.

## 1. Branch and users table

```bash
git switch -c feature/auth-api
```

- Add `users` table: `id`, `email` (unique), `password_hash`, `role` (`user` | `admin`), `created_at`
- Migration file — never edit production DB by hand
- Seed one admin user for testing (document credentials in README for dev only)

Commit: `feat: add users table and migration`.

## 2. Register and login

Implement backend-only endpoints:

- `POST /auth/register` — body: `{ email, password }` → creates user, returns `{ accessToken, refreshToken }`
- `POST /auth/login` — body: `{ email, password }` → returns tokens on success, `401` on bad credentials

Rules:

- Hash passwords with bcrypt (cost factor 10–12)
- Never return `password_hash` in JSON
- Validate email format and minimum password length → `400` on invalid input

Commit: `feat: register and login endpoints`.

## 3. Access token, refresh, and /me

- `GET /me` — requires `Authorization: Bearer <accessToken>` → returns `{ id, email, role }`
- `POST /auth/refresh` — body: `{ refreshToken }` → returns new `{ accessToken }` (and optionally rotated refresh token)

Store refresh tokens in DB (or a `refresh_tokens` table) so you can revoke them.

Access token: short expiry (e.g. 15 min). Refresh token: longer (e.g. 7 days).

Commit: `feat: JWT access, refresh, and /me endpoint`.

## 4. Middleware and RBAC

```javascript
function requireAuth(req, res, next) {
  // verify JWT, attach req.user = { id, role }
}

function requireRole(role) {
  return (req, res, next) => {
    if (req.user.role !== role) return res.status(403).json({ error: "Forbidden" });
    next();
  };
}
```

- Apply `requireAuth` to your main resource routes (create, list scoped to user)
- Add one admin-only route (e.g. `GET /admin/stats` or `DELETE /admin/users/:id`) with `requireRole('admin')`
- Unauthenticated → `401`. Wrong role → `403`.

Commit: `feat: auth middleware and RBAC on routes`.

## 5. Postman collection

Create a Postman (or Bruno/Insomnia) collection with:

1. Register new user
2. Login
3. GET /me (with Bearer token from login)
4. POST /auth/refresh (with refresh token)
5. GET /me again (with new access token)
6. Hit admin route as `user` → expect 403
7. Hit protected route with no token → expect 401

Export collection JSON into repo (e.g. `api/postman/auth.json`) or document steps in README.

Commit: `docs: add Postman auth collection`.

## 6. Merge

```bash
# All endpoints verified in Postman — no UI changes required yet
git push -u origin feature/auth-api
```

Open PR, merge when green.

## Outcome

Your API knows who is calling it. Stage 10 wires login/register screens and an auth gate in vanilla JS.
