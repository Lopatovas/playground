# Scoring system and algorithm

The scanner uses a deterministic scoring model. The LLM does not decide scores, severities, penalties or whether a finding exists.

## Source of truth

The scoring source of truth is the generated findings list:

```ts
interface ScanFinding {
  category: FindingCategory;
  severity: FindingSeverity;
  title: string;
  tableName: string;
  columnName?: string;
  evidence: string;
  scoreImpact: number;
  recommendation: string;
  ruleId: string;
}
```

Profiles produce findings. Findings produce scores. Reports and action plans are derived from findings and scores.

```text
Table/column profiles
  -> deterministic findings
  -> category scores
  -> weighted overall score
  -> action plan/report
```

## Score categories and weights

| Internal category | Report label | Weight |
| --- | --- | ---: |
| `dataQuality` | Data Quality | 30% |
| `privacyCompliance` | Privacy & Compliance | 25% |
| `schemaClarity` | Schema Clarity | 20% |
| `aiUsability` | AI Usability | 15% |
| `monitoringReadiness` | Monitoring Readiness | 10% |

These weights are currently hardcoded in:

```text
apps/api/src/scanner/scoring.service.ts
```

## Category score algorithm

Each category starts at 100 points. For every finding in that category, subtract `finding.scoreImpact`.

```ts
categoryScore = clamp(100 - sum(scoreImpact for category findings), 0, 100);
```

Example:

```text
Privacy & Compliance starts at 100
- email PII finding: -14
- phone PII finding: -14
- date of birth finding: -22
Final privacy score = 50
```

## Overall score algorithm

The overall readiness score is the rounded weighted average of category scores.

```ts
overallScore = round(
  dataQualityScore * 0.30 +
  privacyComplianceScore * 0.25 +
  schemaClarityScore * 0.20 +
  aiUsabilityScore * 0.15 +
  monitoringReadinessScore * 0.10
);
```

Example:

```text
Data Quality: 80 * 0.30 = 24.0
Privacy & Compliance: 60 * 0.25 = 15.0
Schema Clarity: 90 * 0.20 = 18.0
AI Usability: 70 * 0.15 = 10.5
Monitoring Readiness: 50 * 0.10 = 5.0
Overall = round(72.5) = 73
```

## Current finding rules and penalties

Rules are implemented in:

```text
apps/api/src/scanner/risk-detector.service.ts
```

### Data Quality

| Rule ID | Condition | Severity | Impact |
| --- | --- | --- | ---: |
| `table.empty` | Table has zero rows | critical | 35 |
| `table.duplicates.high` | Duplicate rows >= 10% | high | 16 |
| `table.duplicates.medium` | Duplicate rows >= 2% | medium | 8 |
| `column.missing.high` | Column missing >= 50% | high | 14 |
| `column.missing.medium` | Column missing >= 15% | medium | 8 |

### Privacy & Compliance

| Rule ID | Condition | Severity | Impact |
| --- | --- | --- | ---: |
| `privacy.pii.detected` | Email, phone, name, address, IP, DOB or government ID detected | high/critical | 14 or 22 |

Critical privacy impact is used for especially sensitive types:

- `government_id`
- `date_of_birth`

### Schema Clarity

| Rule ID | Condition | Severity | Impact |
| --- | --- | --- | ---: |
| `schema.column_name.ambiguous` | Generic/unclear column name such as `misc`, `flag`, `status_old`, `col_1` | medium | 8 |
| `schema.column.empty` | Column has no non-empty values | medium | 7 |

### AI Usability

| Rule ID | Condition | Severity | Impact |
| --- | --- | --- | ---: |
| `ai.high_cardinality_text.context` | Mostly unique string field without obvious pattern/context | low | 5 |

### Monitoring Readiness

| Rule ID | Condition | Severity | Impact |
| --- | --- | --- | ---: |
| `monitoring.stable_id.missing` | No obvious stable record identifier | medium | 10 |
| `monitoring.timestamp.missing` | No obvious timestamp column | low | 5 |

## PII/type heuristics

PII and type detection are deterministic heuristics in:

```text
apps/api/src/scanner/profiling.service.ts
```

Current signals include:

- email-like values
- phone-like values
- IP address-like values
- date-of-birth column names
- government ID column names
- name/address-like column names
- numeric/date/json/long-text patterns

ISO-like dates such as `2026-01-01` are explicitly excluded from phone matching to avoid false phone PII findings.

## Traceability

Every score reduction is traceable to one or more findings.

A finding includes:

- affected table
- affected column when applicable
- rule ID
- evidence summary
- severity
- score impact
- recommendation

This lets the UI show why a score changed without exposing raw row values.

## Action plan priority

Action item priority is derived from finding severity:

| Severity | Action priority |
| --- | --- |
| critical | P1 |
| high | P1 |
| medium | P2 |
| low | P3 |

The action plan sorts by severity first, then by score impact.

## Recurring comparison

Recurring scan comparison does not rescore historical scans. It compares the completed current report against the most recent previous completed report for the same:

```text
tenantId + datasetName
```

Comparison includes:

- overall score delta
- per-category score deltas
- severity count deltas

## LLM role in scoring

The LLM adapter may rewrite summary/action-plan language, but it does not:

- create findings
- change finding severity
- change score impact
- change category scores
- change the overall score

The LLM receives only aggregate findings and scores, not raw uploaded rows.

## Current limitations and future improvements

Current scoring is intentionally simple and explainable for the POC.

Future improvements could include:

- configurable category weights per tenant/use case
- industry-specific scoring profiles, e.g. gambling, finance, healthcare
- stronger statistical anomaly rules
- relationship-aware multi-table scoring
- data dictionary completeness scoring
- historical trend scoring beyond point-in-time comparison
- explicit confidence values per finding
- user-approved rule overrides
