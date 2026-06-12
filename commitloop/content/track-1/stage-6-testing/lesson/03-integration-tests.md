## Test the HTTP contract

Integration tests hit your **real Express app** without starting a server on a port (using **supertest**):

```javascript
import request from "supertest";
import { createApp } from "../app.js";

describe("POST /workouts", () => {
  it("creates a workout", async () => {
    const app = createApp(testPrisma, testConfig);
    const res = await request(app)
      .post("/workouts")
      .send({ name: "Run", duration_min: 30 })
      .expect(201);

    expect(res.body.name).toBe("Run");
  });

  it("returns 400 for invalid body", async () => {
    const app = createApp(testPrisma, testConfig);
    await request(app)
      .post("/workouts")
      .send({ name: "" })
      .expect(400);
  });
});
```

This verifies routing, JSON parsing, middleware, and handlers together.

## Test database

Never run integration tests against **production** data.

Options for Track 1:

- **Separate SQLite file** — `DATABASE_URL=file:./test.db`, wiped between runs
- **In-memory SQLite** — fast, ephemeral
- **Transaction rollback** — advanced; optional

Reset state between tests so order doesn't matter.

## CommitLoop's own pattern

The CommitLoop API uses this exact approach: `createApp()` with injected Prisma, supertest agents, isolated test DB. You're learning the same pattern professionals use.

## Sad paths matter

Test at least:

- `201` on valid create
- `400` on invalid create
- `200` + array on list
- `404` on missing id (if you have GET by id)

Happy paths alone give false confidence.
