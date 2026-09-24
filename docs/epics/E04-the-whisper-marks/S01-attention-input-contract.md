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
  "changeType": "modified",
  "changedLines": 42,
  "layer": "api",
  "flags": [
    { "id": "layer.api", "severity": "raise", "why": ["path"] },
    { "id": "reach.wide", "severity": "raise", "why": ["consumers=87"] },
    { "id": "reach.multi-route", "severity": "raise", "why": ["routes=14"] },
    { "id": "contract.exports", "severity": "raise", "why": ["searchCustomers"] },
    { "id": "test.present", "severity": "info", "why": ["customerApi.test.ts"] }
  ]
}
```

The payload **is** the flag bundle. Blast radius is one family of flags, not the whole input. Jev may add `jev.*` flags only.

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
