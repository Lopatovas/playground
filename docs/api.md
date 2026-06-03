# API usage

Base URL in local Docker setup:

```text
http://localhost:3000
```

## Health

```http
GET /health
```

Response:

```json
{
  "status": "ok"
}
```

## Tenant header

All scan endpoints require a tenant header:

```http
x-tenant-id: company-x
```

This scopes scan history, report reads and recurring comparison. In production this should be derived from authentication rather than typed manually.

## Upload and enqueue a dataset scan

```http
POST /scans/upload
Content-Type: multipart/form-data
```

Form fields:

| Field | Required | Description |
| --- | --- | --- |
| `file` | yes | CSV or XLSX file |
| `datasetName` | no | Logical dataset name. Used for recurring comparison. |
| `audience` | no | Report audience: `mixed`, `executive`, `technical`, `compliance`, `ai-implementation`. |

Example:

```bash
curl -fsS \
  -H 'x-tenant-id: company-x' \
  -F 'datasetName=player_activity' \
  -F 'audience=mixed' \
  -F 'file=@docs/sample-inputs/player-activity-risky.csv;type=text/csv' \
  http://localhost:3000/scans/upload
```

Response shape. Upload returns a queued report first; poll `GET /scans/:scanId/report` until `status` is `completed` or `failed`:

```ts
interface ScanReport {
  scanId: string;
  tenantId: string;
  datasetName: string;
  status: "completed";
  createdAt: string;
  completedAt: string;
  overallScore: number;
  scoreBreakdown: ScoreBreakdown[];
  summary: ReportSummary;
  actionPlan: ActionItem[];
  profiles: TableProfile[];
  findings: ScanFinding[];
  comparison?: ScanComparison;
}
```

## List scans

```http
GET /scans
```

Returns lightweight scan history items for the supplied `x-tenant-id` from PostgreSQL.

## Get a report

```http
GET /scans/:scanId/report
```

Returns the same `ScanReport` shape produced by upload when the scan belongs to the supplied `x-tenant-id`; otherwise returns 404.

## Recurring comparison behavior

A scan is compared with the most recent previous completed scan where `tenantId + datasetName` matches case-insensitively. This now works across API restarts because reports are persisted in PostgreSQL.

## Operations endpoints

- Swagger/OpenAPI UI: `GET /docs`
- BullMQ queue dashboard: `GET /queues`

The BullMQ dashboard is intended for POC/operator visibility into queued, active, completed and failed scan jobs.

## Scoring docs

The scoring algorithm, weights and current rule catalogue are documented in [scoring.md](scoring.md).
