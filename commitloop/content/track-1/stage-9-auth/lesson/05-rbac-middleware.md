## Role-based access control (RBAC)

Each user has a **role** — e.g. `user` or `admin`. Routes check the role after authentication.

```javascript
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
  };
}

app.delete("/admin/users/:id", requireAuth, requireRole("admin"), deleteUserHandler);
```

## 401 vs 403 — memorize this

| Status | Meaning | Example |
| --- | --- | --- |
| **401** | Not authenticated | No token, expired token, bad password |
| **403** | Authenticated, not allowed | Logged-in `user` hits admin route |

Wrong status codes confuse frontend error handling. Be consistent.

## Middleware chain

Express runs middleware in order — same idea as Stages 4 and 8:

```text
Request → json parser → logger → requireAuth → requireRole('admin') → handler
```

```javascript
app.use(express.json());
app.use(requestLogger);

app.get("/workouts", requireAuth, listMyWorkouts);
app.post("/workouts", requireAuth, createWorkout);
app.get("/admin/stats", requireAuth, requireRole("admin"), adminStats);
```

## Scoping data to the user

Authorization isn't only about roles — **resource ownership** matters:

```javascript
async function deleteWorkout(req, res) {
  const workout = await db.getWorkout(req.params.id);
  if (!workout) return res.status(404).json({ error: "Not found" });
  if (workout.user_id !== req.user.sub && req.user.role !== "admin") {
    return res.status(403).json({ error: "Forbidden" });
  }
  await db.deleteWorkout(req.params.id);
  res.status(204).send();
}
```

Regular users edit their own rows. Admins may override.

## Verify in Postman

Add to your collection:

- Protected route **without** token → 401
- Admin route as `user` → 403
- Admin route as `admin` → 200
- User A cannot GET user B's scoped resource → 403 or empty list

Stage 11 will automate these as integration tests.
