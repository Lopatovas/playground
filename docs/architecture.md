# Architecture

AI Data Readiness Scanner is implemented as a small npm workspace with a Nest.js API, a React web app, and shared TypeScript contracts.

## Workspace layout

```text
apps/
  api/          Nest.js API and scanner services
  web/          React + Vite frontend
packages/
  shared/       Shared scan/report TypeScript contracts
docs/           Product and technical documentation
```

## Runtime components

```text
Browser
  -> React web app
    -> Nest.js API
      -> FileParserService
      -> ProfilingService
      -> RiskDetectorService
      -> ScoringService
      -> ReportService
      -> LlmService
        -> MistralLlmProvider
```

## Scan flow

1. User uploads a CSV or XLSX file in the web app.
2. Web app sends `POST /scans/upload` with multipart form data.
3. API validates the file and derives a dataset name.
4. `FileParserService` parses the file into one or more table-like structures.
5. `ProfilingService` computes deterministic table and column profiles:
   - row count
   - column count
   - duplicate row rate
   - inferred types
   - missing value percentages
   - unique value percentages
   - PII signals
   - sample patterns
6. `RiskDetectorService` converts profiles into traceable findings.
7. `ScoringService` computes five sub-scores and the weighted overall readiness score.
8. `ReportService` builds a layered report and compares with a previous scan for the same dataset name.
9. `LlmService` optionally asks the configured provider to rewrite summary/action plan text.
10. API returns a `ScanReport` JSON response to the web app.

## Deterministic-first principle

Core readiness decisions do not depend on an LLM. The following are deterministic:

- parsing
- profiling
- PII pattern detection
- duplicate detection
- missing value detection
- schema ambiguity findings
- scoring
- recurring scan comparison

The LLM is limited to language generation and report refinement.

## LLM adapter boundary

The app uses an internal provider interface:

```ts
interface LlmProvider {
  readonly name: string;
  isConfigured(): boolean;
  generateReportEnhancement(input: ReportEnhancementInput): Promise<ReportEnhancementOutput | null>;
}
```

Current provider:

- `MistralLlmProvider`

Future providers can be added without changing the scanner pipeline:

- OpenAI
- Anthropic
- Azure OpenAI
- local/private models

## LLM safety rule

Raw uploaded rows are not passed to the LLM adapter. The adapter receives only:

- audience setting
- overall score
- score breakdown
- top findings
- deterministic summary
- deterministic action plan

Example safe LLM payload shape:

```json
{
  "audience": "compliance",
  "overallScore": 72,
  "findings": [
    {
      "category": "PRIVACY_COMPLIANCE",
      "severity": "high",
      "title": "Potential PII detected",
      "tableName": "customers",
      "columnName": "email",
      "evidence": "Detected PII signals: email.",
      "scoreImpact": 14,
      "ruleId": "privacy.pii.detected"
    }
  ]
}
```

Raw values such as actual emails, phone numbers, names, addresses, or identifiers should not appear in this payload.

## Scoring model

The overall readiness score is a weighted average of five sub-scores:

| Category | Weight |
| --- | ---: |
| Data Quality | 30% |
| Privacy & Compliance | 25% |
| Schema Clarity | 20% |
| AI Usability | 15% |
| Monitoring Readiness | 10% |

Each finding has a `scoreImpact`. Category scores start at 100 and subtract all impacts for findings in that category, clamped to 0-100.

## Report layers

The report is intentionally layered for mixed audiences:

1. Executive summary
2. Score breakdown
3. Top risks
4. Prioritized action plan
5. Technical findings table
6. Data profile
7. Previous scan comparison when available

## Current limitations

This PR is a prototype foundation. It currently uses in-memory scan storage inside `ScansService`. For production, use the database structure in [database-structure.md](database-structure.md), object storage for raw uploads, and background jobs for large files.
