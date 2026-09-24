# E04-S02 — Classify attention with Jev

**Epic:** E04 The Whisper Marks  
**MVP:** After MVP if Jev is not already a clear API  
**Status:** Draft

## Outcome

Jev answers small classification questions and returns a mark. It does not narrate the PR.

Questions we care about:

- Likely architectural / shared?
- Likely broad impact?
- Likely business logic?
- Unusual vs surrounding code?
- Likely UI-only?
- Likely data-flow / state-management?
- Does this symbol deserve extra human attention?

## Scope

### In

Example output:

```json
{
  "attention": "high",
  "categories": ["shared-abstraction", "data-flow"],
  "confidence": 0.62,
  "answers": {
    "shared": true,
    "businessLogic": true,
    "uiOnly": false
  }
}
```

- Fast, bounded calls
- Timeouts and failures become "unmarked"
- Stub classifier for local dev (rules on `isShared` + layer)

### Out

- Prose summaries
- Comments posted to the host
- Correctness opinions
- Retry storms that block the UI

## Acceptance criteria

- [ ] A high-consumer API node can come back `attention: high` with categories
- [ ] A leaf card can come back `low` / `ui-only`
- [ ] Jev down → nodes stay unclassified, cockpit still works
- [ ] Output cannot contain an `approval` or `review` field
- [ ] Calls are logged as classifications, not reviews

## Tasks

- [ ] Document the Jev adapter interface
- [ ] Implement a deterministic stub (so High Seat can be built)
- [ ] Implement the real Jev client when the API is known
- [ ] Timeouts, circuit breaker, per-session cache
- [ ] Contract tests for schema and failure modes

## Depends on

- E04-S01
- A real Jev endpoint or a decision to stay on the stub

## Open questions

- Exact Jev API, auth, and latency
- Do we ever send a hunk to judge "unusual vs surrounding code"?
