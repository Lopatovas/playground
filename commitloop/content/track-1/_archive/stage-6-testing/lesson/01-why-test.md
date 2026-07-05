## Manual testing doesn't scale

You deployed in Stage 5. Every change, you click through the UI:

1. Open the app
2. Create a workout
3. Refresh
4. Hope nothing broke

That works for a week. Then you refactor validation in your API and accidentally break POST. You won't notice until a user (or you) hits production.

**Automated tests** run the same checks in seconds, every push.

## What tests give you

| Benefit | Example |
| --- | --- |
| **Regression safety** | Refactor routes — tests still pass → behavior preserved |
| **Documentation** | `expect(res.status).toBe(400)` shows invalid input is rejected |
| **Faster feedback** | `npm test` in 5s vs manual QA in 5min |
| **CI gate** | Broken main blocked before merge |

Tests don't replace thinking. They **lock in** behavior you already decided matters.

## Tests fit your layers

Your stack has layers to test:

- **Unit tests** → validators and pure functions (fast, no HTTP)
- **Integration tests** → Express routes with supertest (real HTTP, test DB)
- **E2E tests** → browser automation (later, optional for Track 1)

Start where failures hurt most: **API validation and endpoints**.
