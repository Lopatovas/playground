# TODO / roadmap

This document tracks known follow-up work after the current POC.

## High priority

### Configurable rules and scoring

The current scoring and detection rules are deterministic but hardcoded in TypeScript.

Current files:

- `apps/api/src/scanner/risk-detector.service.ts`
- `apps/api/src/scanner/scoring.service.ts`
- `apps/api/src/scanner/profiling.service.ts`

Next step:

- extract detection rules into explicit rule objects
- move thresholds, severity, score impact and enabled/disabled flags into config
- support scoring profiles, e.g. `default`, `gambling`, `finance`, `healthcare`
- eventually allow tenant-specific rule/scoring overrides

Suggested shape:

```ts
interface DetectionRule {
  id: string;
  category: FindingCategory;
  severity: FindingSeverity;
  defaultScoreImpact: number;
  appliesTo: "table" | "column";
  evaluate(context: RuleContext): ScanFinding | null;
}
```

Keep rule logic in code initially, but make parameters configurable.

### Replace DB-stored upload bytes with object storage

For the POC, uploaded file bytes are stored in Postgres until the BullMQ worker completes, then cleared.

Production should use encrypted object storage:

- S3-compatible storage
- signed URLs or private bucket access
- retention policy per tenant
- raw file deletion audit events

### Authentication-backed tenant context

The POC uses a plain `x-tenant-id` string header.

Production should derive tenant context from:

- authenticated user/session/JWT
- tenant membership
- role/permission checks

## Medium priority

### Prisma migrations

Docker currently uses `prisma db push` for POC startup simplicity.

Production should use:

- generated Prisma migrations
- migration CI checks
- explicit deploy migration step

### Larger-file processing

Current parsing is suitable for POC/medium files, but larger exports should use:

- streaming CSV parsing
- row sampling options
- file size caps per tenant
- progress updates
- chunked profiling

### Multi-file / multi-table datasets

The internal report model supports multiple table profiles, but the current upload flow is mostly single-file oriented.

Future support:

- ZIP upload with multiple CSVs
- multiple XLSX sheets
- table relationship inference
- foreign-key/stable identifier checks across tables

### Better PII and semantic detection

Improve deterministic heuristics with:

- country-specific phone/address patterns
- configurable PII dictionaries
- domain-specific identifiers
- optional local NLP/entity detection
- masked example support with strict redaction

## Lower priority

### Report exports

Add downloadable:

- HTML report
- PDF report
- JSON export

### Frontend polish

Improve:

- loading/progress states
- failed job display
- report filtering
- finding search
- category drill-downs
- comparison charts

### API hardening

Add:

- request rate limits
- stricter upload MIME validation
- global exception response shape
- request IDs
- structured logging
- audit events

### CI

Add CI checks for:

- tests
- typecheck
- build
- audit
- Prisma schema validation
