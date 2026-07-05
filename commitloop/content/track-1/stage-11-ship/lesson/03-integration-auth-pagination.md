## Test the HTTP contract

Integration tests hit your **real Express app** with **supertest** — no manual port, no browser:

```javascript
import request from "supertest";
import { createApp } from "../app.js";

describe("Auth", () => {
  it("GET /me without token returns 401", async () => {
    const app = createApp(testDb, testConfig);
    await request(app).get("/me").expect(401);
  });

  it("admin route as user returns 403", async () => {
    const app = createApp(testDb, testConfig);
    const { body } = await request(app)
      .post("/auth/login")
      .send({ email: "user@test.com", password: "password123" })
      .expect(200);

    await request(app)
      .get("/admin/stats")
      .set("Authorization", `Bearer ${body.accessToken}`)
      .expect(403);
  });
});
```

## Auth sad paths (required for graduation)

| Test | Status |
| --- | --- |
| Protected route, no token | 401 |
| Admin route, role `user` | 403 |
| Valid login + `/me` | 200 + user shape |
| Invalid login | 401 |

These lock in Stage 9 RBAC — can't merge a PR that drops `requireAuth` silently.

## Pagination tests

```javascript
it("page 2 differs from page 1 when total > limit", async () => {
  const app = createApp(testDb, testConfig);
  const token = await loginAs(app, "user@test.com");

  // seed 12 items with limit 5
  const page1 = await request(app)
    .get("/workouts?page=1&limit=5")
    .set("Authorization", `Bearer ${token}`)
    .expect(200);

  const page2 = await request(app)
    .get("/workouts?page=2&limit=5")
    .set("Authorization", `Bearer ${token}`)
    .expect(200);

  expect(page1.body.items[0].id).not.toBe(page2.body.items[0].id);
  expect(page1.body.total).toBeGreaterThan(5);
});
```

## Relation / join test

From Stage 7 — verify related data comes back correctly:

```javascript
it("GET /workouts includes category name via join", async () => {
  const app = createApp(testDb, testConfig);
  const token = await loginAs(app, "user@test.com");

  const res = await request(app)
    .get("/workouts/1")
    .set("Authorization", `Bearer ${token}`)
    .expect(200);

  expect(res.body.category_name).toBeDefined();
});
```

Adjust to your schema — point is: **test the join you added**, not only flat CRUD.

## Search query param

```javascript
await request(app)
  .get("/workouts?q=run")
  .set("Authorization", `Bearer ${token}`)
  .expect(200);
// assert all returned items match filter (or count > 0 when seeded)
```

## Test database rules

- Separate file or in-memory SQLite
- Seed fixtures in `beforeEach` or dedicated setup
- Never production data

Sad paths matter as much as happy paths — especially for auth.
