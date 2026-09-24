# E04-S01 — Attention input contract

**Epic:** E04 The Whisper Marks  
**MVP:** Yes  
**Status:** Draft

## Outcome

Anything that asks Jev (or a stub) speaks a small, typed payload. We do not dump the repository. We do not dump a 3,000-line diff. We send facts the graph already knows, plus a tight snippet only if needed later.

## Scope

### In

Example payload:

```json
{
  "symbol": "customerApi.searchCustomers",
  "file": "src/api/customerApi.ts",
  "changedLines": 42,
  "consumerCount": 87,
  "routeCount": 14,
  "isShared": true,
  "changeType": "modified",
  "layer": "api"
}
```

- One payload per changed symbol or file
- Versioned schema
- Optional snippet field, off by default in MVP

### Out

- Whole-file or whole-PR prompts
- Ticket text
- "Write a review" instructions in the contract

## Acceptance criteria

- [ ] Every graph node that can be classified can be serialized to the contract
- [ ] `changedLines` is a fact, not a risk score
- [ ] Schema rejects unknown instruction-like fields we do not want
- [ ] A fixture node produces a stable payload

## Tasks

- [ ] Write `AttentionInput` types
- [ ] Mapper from E02 nodes
- [ ] JSON schema + examples
- [ ] Unit tests for mapping and for oversized-snippet rejection

## Depends on

- E02-S05 (shared flag / layer / counts)

## Open questions

- Is a short diff hunk ever allowed in v1, or strictly structured facts?
- Batch vs one call per symbol
