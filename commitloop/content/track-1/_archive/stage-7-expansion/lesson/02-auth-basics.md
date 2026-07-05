## Authentication vs authorization

| Term | Question | Example |
| --- | --- | --- |
| **Authentication** | Who are you? | Login with email + password |
| **Authorization** | What may you do? | Only delete *your* workouts |

Get authentication working first. Authorization rules sit on top.

## Common patterns

**Session + cookie** (CommitLoop uses this):

1. User posts credentials
2. Server verifies, creates session, sets httpOnly cookie
3. Later requests send cookie; server loads `userId`

**JWT (token)**:

1. Server returns signed token
2. Client sends `Authorization: Bearer <token>`
3. Server verifies signature, reads claims

For Track 1, sessions or simple JWT both work. Prefer what your stack already uses.

## Password rules

- **Never** store plain-text passwords
- **Hash** with bcrypt or argon2 (slow on purpose)
- Compare with `bcrypt.compare(plain, hash)`

```javascript
const hash = await bcrypt.hash(password, 12);
const ok = await bcrypt.compare(password, hash);
```

## Protected routes

```javascript
function requireAuth(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
}

app.post("/workouts", requireAuth, createWorkoutHandler);
```

Frontend: redirect to login if `/me` returns 401.

## OAuth (optional stretch)

"Sign in with GitHub" is popular — CommitLoop itself uses it. For your project, email/password or a single OAuth provider is enough for Stage 7.
