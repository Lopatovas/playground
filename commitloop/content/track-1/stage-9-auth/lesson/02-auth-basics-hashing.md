## Authentication vs authorization

| Term | Question | Example |
| --- | --- | --- |
| **Authentication** | Who are you? | Login with email + password |
| **Authorization** | What may you do? | Only delete *your* workouts; only `admin` can ban users |

Get authentication working first. Authorization rules sit on top.

## The auth endpoints you are building

| Endpoint | Purpose |
| --- | --- |
| `POST /auth/register` | Create account, return tokens |
| `POST /auth/login` | Verify credentials, return tokens |
| `POST /auth/refresh` | Exchange refresh token for new access token |
| `GET /me` | Return current user from access token |

No frontend in this stage — Postman proves each one.

## Password rules

- **Never** store plain-text passwords
- **Hash** with bcrypt or argon2 (slow on purpose — blocks brute force)
- Compare with `bcrypt.compare(plain, hash)` at login

```javascript
const hash = await bcrypt.hash(password, 12);
const ok = await bcrypt.compare(password, hash);
```

## Users table sketch

```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  created_at TEXT NOT NULL
);
```

Register hashes the password before INSERT. Login SELECTs by email, compares hash, then issues tokens.

## Structured errors

Use consistent JSON for auth failures:

```json
{ "error": { "code": "INVALID_CREDENTIALS", "message": "Email or password incorrect" } }
```

Return `400` for validation, `401` for bad login, never leak whether the email exists (optional hardening — same message for unknown email vs wrong password).
