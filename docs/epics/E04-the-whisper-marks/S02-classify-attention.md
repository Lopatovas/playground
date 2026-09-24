# E04-S02 — Classify attention with Jev

**Epic:** E04 The Whisper Marks  
**MVP:** Stub in MVP; live client after TypeSafe access  
**Status:** Draft

## Outcome

Each changed symbol can receive typed marks from Jev — or from a stub that uses the same shape. Jev does not narrate the PR. It cannot write comments.

Jev question primitives ([TypeSafe docs](https://docs.typesafe.ai/primitives)):

- **Noul** — yes/no probability (shared? business logic? UI-only?)
- **Choice** — one of a closed set (layer: `api | store | ui | unknown`)
- **Score** — ordered attention (`low | medium | high`)

One request can ask several questions against one small `state` payload from E04-S01. Answers come back with probabilities and confidence.

## Scope

### In

Example composed mark (our model, after Jev answers):

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

- Parallel questions per node; batch nodes if the API allows
- Timeouts → unmarked
- Deterministic stub (rules on `isShared` + layer) so the High Seat works offline

### Out

- Prose summaries
- Comments posted to the host
- Correctness opinions
- Retry storms that block the UI
- Feeding the whole PR as a "review this" prompt (Jev cannot emit that anyway)

## Acceptance criteria

- [ ] Stub and live client share one `AttentionMark` type
- [ ] A high-consumer API node can come back `attention: high` with categories
- [ ] A leaf card can come back `low` / `ui-only`
- [ ] Jev down or no key → unmarked, cockpit still works
- [ ] Output cannot contain an `approval` or `review` field
- [ ] We never send a ticket body as `state` in MVP

## Tasks

- [ ] Map our questions onto Choice / Score / Noul
- [ ] Deterministic stub
- [ ] TypeSafe client behind a flag (no key required to run Scryglass)
- [ ] Timeouts, cache per `(headSha, symbol)`
- [ ] Contract tests for schema and failure modes

## Depends on

- E04-S01

## Open questions

- API key storage once access exists
- Short hunk in `state` or graph facts only
