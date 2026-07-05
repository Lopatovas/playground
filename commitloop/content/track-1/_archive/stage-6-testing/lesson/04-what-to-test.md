## You can't test everything

Perfect coverage is a trap. **High-value tests** for your stage:

### Priority 1 — Validation & business rules

Will a refactor break "reject negative duration"? Unit test it.

### Priority 2 — HTTP contract

Does `POST /workouts` still return 201 with the shape your frontend expects? Integration test it.

### Priority 3 — Auth boundaries (Stage 7 preview)

After you add login: unauthenticated requests get 401. Test that before shipping.

### Lower priority for now

- Every CSS class
- Pixel-perfect layout
- Third-party OAuth flows (mock them)

## The iceberg

```text
        /\
       /  \  E2E (few, slow, brittle)
      /----\
     /      \ Integration (some, medium)
    /--------\
   /  Unit    \ (many, fast)
  /____________\
```

More tests at the bottom, fewer at the top.

## When a test fails

1. **Bug in code** → fix code
2. **Intentional behavior change** → update test
3. **Flaky test** → fix test (timers, shared state, race)

Never delete a failing test without understanding which case you're in.
