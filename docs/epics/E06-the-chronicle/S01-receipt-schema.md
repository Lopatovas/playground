# E06-S01 — Receipt schema

**Epic:** E06 The Chronicle  
**MVP:** After MVP  
**Status:** Draft

## Outcome

There is a versioned receipt schema that can express the brief's example without adding a verdict.

## Scope

### In

Fields along these lines:

- Identity: PR, branch, base
- Changed: files, lines (fact), symbols
- High-impact nodes (from the Web)
- Routes
- Shared components
- Tests: affected / existing / added
- Visual: routes rendered, states rendered, visual changes detected
- Attention counts
- Jev: classifications available, confidence shown, **no blocking decisions**

### Out

- `approved`, `lgtm`, `reviewPassed`
- Requiring every optional section to be present

## Acceptance criteria

- [ ] JSON schema validates the brief-shaped example
- [ ] Schema rejects a `verdict` / `approved` field
- [ ] Missing Mirror or Jev sections are allowed
- [ ] `lines` is documented as a fact, not a risk score

## Tasks

- [ ] Draft JSON schema
- [ ] Example receipt (markdown-friendly names in a `$comment` or sibling doc)
- [ ] Versioning rules
- [ ] Schema tests

## Depends on

- Session models from E01–E04

## Open questions

- One schema vs internal session schema + thinner public receipt
- Do we include file paths only, or also symbol lists, in v1?
