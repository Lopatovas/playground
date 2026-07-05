## Manual testing doesn't scale

You built auth, search, and pagination across Stages 7–10. Every change, you could click through the UI — register, login, search, hope nothing broke.

That works for a week. Then you refactor validation and accidentally break POST. You won't notice until production.

**Automated tests** run the same checks in seconds, every push.

## What tests give you

| Benefit | Example |
| --- | --- |
| **Regression safety** | Refactor routes — tests still pass → behavior preserved |
| **Documentation** | `expect(res.status).toBe(401)` shows unauthenticated access is rejected |
| **Faster feedback** | `npm test` in 5s vs manual QA in 5min |
| **CI gate** | Broken main blocked before merge |

Tests don't replace thinking. They **lock in** behavior you already decided matters.

## Unit tests: pure logic first

Unit tests target **one function** in isolation. No network, no database (or mocked).

```javascript
import { describe, it, expect } from "vitest";
import { validateWorkout } from "./workout.service.js";

describe("validateWorkout", () => {
  it("rejects empty name", () => {
    const errors = validateWorkout({ name: "", duration_min: 30 });
    expect(errors).toContain("name is required");
  });

  it("accepts valid input", () => {
    const errors = validateWorkout({ name: "Run", duration_min: 30 });
    expect(errors).toHaveLength(0);
  });
});
```

## Arrange, act, assert

1. **Arrange** — set up inputs
2. **Act** — call the function
3. **Assert** — `expect(...)` the outcome

## What to unit test

- Validation rules
- Password hashing helpers (compare returns true/false)
- Pure transforms (pagination math, query parsing)

**Don't** unit test Express itself or third-party libraries.

## Tests fit your layers

- **Unit tests** → validators and services (fast)
- **Integration tests** → HTTP routes with supertest (next lesson)
- **E2E browser tests** → optional, Track 2

Start where failures hurt most: **API validation and auth**.
