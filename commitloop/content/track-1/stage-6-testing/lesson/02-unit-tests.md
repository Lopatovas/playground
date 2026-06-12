## Test pure logic first

Unit tests target **one function** in isolation. No network, no database (or mocked), no browser.

```javascript
// workout.service.test.js
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

Every test follows the same rhythm:

1. **Arrange** — set up inputs
2. **Act** — call the function
3. **Assert** — `expect(...)` the outcome

If a test needs 50 lines of setup, the function might be doing too much — a design smell, not just a test smell.

## Vitest in this stack

CommitLoop uses **Vitest** (Vite-native, Jest-compatible API):

```bash
npm test              # run once
npm run test:watch    # watch mode while coding
```

Put test files next to source (`workout.service.test.ts`) or in `__tests__/` — pick one convention and stick to it.

## What not to unit test

- Framework internals (Express itself)
- Third-party libraries
- Trivial getters with no logic

**Do** test your validation, business rules, and pure transforms.
