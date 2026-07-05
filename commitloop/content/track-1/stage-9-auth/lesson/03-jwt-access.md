## What is a JWT?

A **JSON Web Token** is a signed string the client stores and sends on each request. The server verifies the signature — if valid, it trusts the **claims** inside without hitting the database every time.

```text
eyJhbGciOiJIUzI1NiIs...   ← header.payload.signature (base64url)
```

Decoded payload (example):

```json
{
  "sub": "42",
  "email": "alice@example.com",
  "role": "user",
  "iat": 1710000000,
  "exp": 1710000900
}
```

- `sub` — subject (user id)
- `exp` — expiry (keep access tokens **short** — e.g. 15 minutes)

## Issue on login

```javascript
import jwt from "jsonwebtoken";

function signAccessToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "15m" }
  );
}
```

Return `{ accessToken, refreshToken }` in the login/register response body.

## Verify in middleware

```javascript
function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authentication required" });
  }
  const token = header.slice(7);
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}
```

## JWT vs session cookie

| | JWT (Bearer) | Session cookie |
| --- | --- | --- |
| State | Mostly stateless on server | Server stores session |
| Mobile / SPA | Easy — send header | Needs cookie + CORS credentials |
| Revoke instantly | Harder (until expiry) | Delete session row |

Track 1 uses **JWT + refresh** — common for SPAs and mobile clients. Stage 10 stores tokens in `localStorage` or memory and sends the Bearer header on fetch.

## Never put in a JWT

- Password or password hash
- Refresh token (use a separate token type)
- Large objects — keep claims small
