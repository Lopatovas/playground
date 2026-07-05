## The problem with long-lived access tokens

If an access token lasts 30 days and someone steals it, they have 30 days of access. You can't easily revoke a JWT without a blocklist.

**Solution:** two tokens with different jobs.

| Token | Lifetime | Sent how | Purpose |
| --- | --- | --- | --- |
| **Access** | Short (15 min) | `Authorization: Bearer` on every API call | Prove identity for requests |
| **Refresh** | Long (7 days) | Only to `POST /auth/refresh` | Get a new access token without re-entering password |

## Refresh endpoint

```javascript
app.post("/auth/refresh", async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ error: "refreshToken required" });

  // 1. Look up token in DB (hashed or by id)
  // 2. Check not expired / not revoked
  // 3. Issue new access token
  // 4. Optionally rotate refresh token (invalidate old, issue new)

  const accessToken = signAccessToken(user);
  res.json({ accessToken });
});
```

## Store refresh tokens server-side

Don't trust refresh tokens blindly. Persist them so you can **revoke**:

```sql
CREATE TABLE refresh_tokens (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  token_hash TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  revoked_at TEXT
);
```

On logout: set `revoked_at`. On refresh: verify hash matches and not expired.

## Rotation (recommended)

When refresh succeeds:

1. Invalidate the old refresh token
2. Issue a **new** refresh token alongside the new access token

If a stolen refresh token is reused after rotation, reject it — signals possible theft.

## Test in Postman

1. Login → save both tokens
2. Call `/me` with access token → 200
3. Wait for access to expire (or temporarily set `expiresIn: "1s"` in dev)
4. Call `/me` → 401
5. POST `/auth/refresh` → new access token
6. Call `/me` again → 200

This flow is what Stage 10's frontend will automate silently.
